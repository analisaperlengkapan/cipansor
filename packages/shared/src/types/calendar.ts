export enum EventType {
  ACADEMIC = 'ACADEMIC',
  RELIGIOUS = 'RELIGIOUS',
  EXTRACURRICULAR = 'EXTRACURRICULAR',
  MEETING = 'MEETING',
  CEREMONY = 'CEREMONY',
  HOLIDAY = 'HOLIDAY',
  OTHER = 'OTHER'
}

export enum EventScope {
  ALL_UNITS = 'ALL_UNITS',
  SPECIFIC_UNIT = 'SPECIFIC_UNIT',
  SPECIFIC_CLASS = 'SPECIFIC_CLASS'
}

export interface CalendarEvent {
  id: string;
  unitId?: string | null;
  classId?: string | null;
  title: string;
  description?: string | null;
  eventType: EventType;
  scope: EventScope;
  startDate: string; // ISO Date string
  endDate?: string | null; // ISO Date string
  isAllDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  isOnline: boolean;
  onlineUrl?: string | null;
  isRecurring: boolean;
  recurrenceRule?: string | null;
  isPublic: boolean;
  color?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateCalendarEventInput = Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdById'> & {
  unitId?: string | null;
  classId?: string | null;
};

export type UpdateCalendarEventInput = Partial<CreateCalendarEventInput>;
