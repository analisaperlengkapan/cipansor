/**
 * Calendar Sync Service
 * Provides iCal and Google Calendar export functionality
 */

import { prisma } from '@/lib/prisma';

interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    location?: string;
    startDate: Date;
    endDate: Date;
    allDay?: boolean;
    category: 'academic' | 'religious' | 'event' | 'exam' | 'holiday';
}

/**
 * Generate iCal format string from events
 */
export function generateICalendar(events: CalendarEvent[], calendarName: string = 'Cipansor'): string {
    const lines: string[] = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Cipansor//Calendar//ID',
        `X-WR-CALNAME:${calendarName}`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
    ];

    events.forEach((event) => {
        const uid = `${event.id}@cipansor.id`;
        const dtstamp = formatICalDate(new Date());
        const dtstart = event.allDay
            ? formatICalDateOnly(event.startDate)
            : formatICalDate(event.startDate);
        const dtend = event.allDay
            ? formatICalDateOnly(event.endDate)
            : formatICalDate(event.endDate);

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${dtstamp}`);
        lines.push(event.allDay ? `DTSTART;VALUE=DATE:${dtstart}` : `DTSTART:${dtstart}`);
        lines.push(event.allDay ? `DTEND;VALUE=DATE:${dtend}` : `DTEND:${dtend}`);
        lines.push(`SUMMARY:${escapeICalText(event.title)}`);
        if (event.description) {
            lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
        }
        if (event.location) {
            lines.push(`LOCATION:${escapeICalText(event.location)}`);
        }
        lines.push(`CATEGORIES:${event.category.toUpperCase()}`);
        lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
}

/**
 * Format date for iCal (UTC)
 */
function formatICalDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Format date only for all-day events
 */
function formatICalDateOnly(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
}

/**
 * Escape special characters in iCal text
 */
function escapeICalText(text: string): string {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
}

/**
 * Get academic calendar events
 */
export async function getAcademicEvents(
    unitId?: string,
    startDate?: Date,
    endDate?: Date
): Promise<CalendarEvent[]> {
    const where: Record<string, unknown> = {};

    if (unitId) where.unitId = unitId;
    if (startDate || endDate) {
        where.startDate = {};
        if (startDate) (where.startDate as Record<string, Date>).gte = startDate;
        if (endDate) (where.startDate as Record<string, Date>).lte = endDate;
    }

    const events = await prisma.academicEvent.findMany({
        where,
        orderBy: { startDate: 'asc' },
        include: { unit: { select: { name: true } } },
    });

    return events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description || undefined,
        location: e.location || undefined,
        startDate: e.startDate,
        endDate: e.endDate,
        allDay: e.allDay,
        category: mapEventCategory(e.type),
    }));
}

/**
 * Map event type to category
 */
function mapEventCategory(type: string): CalendarEvent['category'] {
    switch (type) {
        case 'EXAM':
        case 'QUIZ':
            return 'exam';
        case 'HOLIDAY':
            return 'holiday';
        case 'RELIGIOUS':
            return 'religious';
        case 'ACADEMIC':
            return 'academic';
        default:
            return 'event';
    }
}

/**
 * Generate Google Calendar URL for single event
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        dates: `${formatGoogleDate(event.startDate)}/${formatGoogleDate(event.endDate)}`,
        details: event.description || '',
        location: event.location || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Format date for Google Calendar URL
 */
function formatGoogleDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Export user's schedule as iCal
 */
export async function exportUserSchedule(userId: string): Promise<string> {
    // Get user's relevant events
    const student = await prisma.student.findFirst({
        where: { userId },
        include: { unit: true, class: true },
    });

    if (!student) {
        return generateICalendar([], 'Cipansor');
    }

    const events = await getAcademicEvents(student.unitId);
    return generateICalendar(events, `Cipansor - ${student.unit?.name || 'Kalender'}`);
}
