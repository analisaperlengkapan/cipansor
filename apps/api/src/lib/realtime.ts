/**
 * Real-time Events Service
 * Provides Socket.IO integration for live dashboard updates
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

// Event types
export interface LiveEvent {
    type: 'attendance' | 'payment' | 'tahfidz' | 'notification';
    data: unknown;
    timestamp: string;
}

export interface AttendanceEvent {
    studentId: string;
    studentName: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    unitName: string;
    className: string;
    time: string;
}

export interface PaymentEvent {
    invoiceId: string;
    studentName: string;
    amount: number;
    type: string;
    unitName: string;
    time: string;
}

export interface TahfidzEvent {
    studentId: string;
    studentName: string;
    surah: string;
    ayahCount: number;
    unitName: string;
    time: string;
}

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server
 */
export function initializeSocketIO(httpServer: HTTPServer): SocketIOServer {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket: Socket) => {
        logger.info(`Client connected: ${socket.id}`);

        // Join unit-specific rooms
        socket.on('join-unit', (unitId: string) => {
            socket.join(`unit:${unitId}`);
            logger.info(`Socket ${socket.id} joined unit:${unitId}`);
        });

        // Join role-specific rooms
        socket.on('join-role', (role: string) => {
            socket.join(`role:${role}`);
            logger.info(`Socket ${socket.id} joined role:${role}`);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            logger.info(`Client disconnected: ${socket.id}`);
        });

        // Send initial data on connect
        sendRecentEvents(socket);
    });

    logger.info('Socket.IO initialized');
    return io;
}

/**
 * Get Socket.IO instance
 */
export function getIO(): SocketIOServer | null {
    return io;
}

/**
 * Broadcast attendance event
 */
export function broadcastAttendance(event: AttendanceEvent): void {
    if (!io) return;

    const liveEvent: LiveEvent = {
        type: 'attendance',
        data: event,
        timestamp: new Date().toISOString(),
    };

    // Broadcast to all clients
    io.emit('live-event', liveEvent);

    // Also emit specific attendance event
    io.emit('attendance-update', event);
}

/**
 * Broadcast payment event
 */
export function broadcastPayment(event: PaymentEvent): void {
    if (!io) return;

    const liveEvent: LiveEvent = {
        type: 'payment',
        data: event,
        timestamp: new Date().toISOString(),
    };

    io.emit('live-event', liveEvent);
    io.emit('payment-update', event);
}

/**
 * Broadcast tahfidz event
 */
export function broadcastTahfidz(event: TahfidzEvent): void {
    if (!io) return;

    const liveEvent: LiveEvent = {
        type: 'tahfidz',
        data: event,
        timestamp: new Date().toISOString(),
    };

    io.emit('live-event', liveEvent);
    io.emit('tahfidz-update', event);
}

/**
 * Send recent events to newly connected socket
 */
async function sendRecentEvents(socket: Socket): Promise<void> {
    try {
        // Get recent attendance (last 10)
        const recentAttendance = await prisma.attendance.findMany({
            take: 10,
            orderBy: { date: 'desc' },
            include: {
                student: {
                    include: {
                        user: { select: { name: true } },
                        unit: { select: { name: true } },
                    },
                },
            },
        });

        const attendanceEvents: AttendanceEvent[] = recentAttendance.map((a) => ({
            studentId: a.studentId,
            studentName: a.student.user?.name || 'Unknown',
            status: a.status as AttendanceEvent['status'],
            unitName: a.student.unit?.name || '',
            className: '',
            time: a.date.toISOString(),
        }));

        socket.emit('initial-attendance', attendanceEvents);

        // Get recent payments (last 10)
        const recentPayments = await prisma.payment.findMany({
            take: 10,
            orderBy: { paidAt: 'desc' },
            include: {
                invoice: {
                    include: {
                        student: {
                            include: {
                                user: { select: { name: true } },
                                unit: { select: { name: true } },
                            },
                        },
                    },
                },
            },
        });

        const paymentEvents: PaymentEvent[] = recentPayments.map((p) => ({
            invoiceId: p.invoiceId,
            studentName: p.invoice.student?.user?.name || 'Unknown',
            amount: Number(p.amount),
            type: 'payment',
            unitName: p.invoice.student?.unit?.name || '',
            time: p.paidAt?.toISOString() || '',
        }));

        socket.emit('initial-payments', paymentEvents);

    } catch (error) {
        logger.error('Error sending recent events:', error);
    }
}

/**
 * Get live dashboard summary
 */
export async function getLiveDashboardSummary(): Promise<{
    todayAttendance: { present: number; absent: number; late: number };
    todayRevenue: number;
    recentActivity: LiveEvent[];
}> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's attendance
    const attendanceCounts = await prisma.attendance.groupBy({
        by: ['status'],
        where: { date: { gte: today } },
        _count: true,
    });

    const todayAttendance = {
        present: attendanceCounts.find((a) => a.status === 'PRESENT')?._count || 0,
        absent: attendanceCounts.find((a) => a.status === 'ABSENT')?._count || 0,
        late: attendanceCounts.find((a) => a.status === 'LATE')?._count || 0,
    };

    // Today's revenue
    const todayPayments = await prisma.payment.aggregate({
        where: { paidAt: { gte: today } },
        _sum: { amount: true },
    });

    return {
        todayAttendance,
        todayRevenue: Number(todayPayments._sum.amount || 0),
        recentActivity: [],
    };
}
