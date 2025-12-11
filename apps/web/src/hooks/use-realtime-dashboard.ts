import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface DashboardMetrics {
  timestamp: string;
  students?: {
    total: number;
    active: number;
  };
  teachers?: {
    total: number;
  };
  attendance?: {
    rate: number;
    present: number;
    total: number;
  };
  tahfidz?: {
    totalHafidz: number;
    avgQuality: number;
    simaanThisMonth: number;
  };
}

interface DashboardAlert {
  id: string;
  unitId?: string;
  metricType: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: string;
}

interface UseRealtimeDashboardOptions {
  enabled?: boolean;
  unitIds?: string[];
  metrics?: string[];
  onMetricsUpdate?: (data: DashboardMetrics) => void;
  onAlert?: (alert: DashboardAlert) => void;
}

export function useRealtimeDashboard(options: UseRealtimeDashboardOptions = {}) {
  const {
    enabled = true,
    unitIds = [],
    metrics = ['students', 'attendance', 'tahfidz'],
    onMetricsUpdate,
    onAlert,
  } = options;

  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Get access token from storage
  const getAccessToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }, []);

  // Calculate exponential backoff delay
  const getReconnectDelay = useCallback((attempt: number) => {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    return delay + Math.random() * 1000; // Add jitter
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const token = getAccessToken();
    if (!token) {
      console.warn('No access token found, skipping WebSocket connection');
      return;
    }

    // Connect to WebSocket server
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    
    const newSocket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: getReconnectDelay(0),
      reconnectionDelayMax: 30000,
      reconnectionAttempts: Infinity, // Keep trying
      timeout: 10000, // 10 second connection timeout
    });

    // Connection handlers
    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      setReconnectAttempts(0);
      setConnectionError(null);
      
      toast.success('Dashboard terhubung', { duration: 2000 });
      
      // Subscribe to dashboard updates
      newSocket.emit('dashboard:subscribe', {
        unitIds: unitIds.length > 0 ? unitIds : ['all'],
        metrics,
      });
    });

    newSocket.on('disconnect', (reason: string) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server forcefully disconnected - probably auth issue
        setConnectionError('Authentication failed. Please login again.');
        toast.error('Sesi berakhir. Silakan login kembali.');
      } else if (reason === 'transport close' || reason === 'ping timeout') {
        // Network issue - will auto-reconnect
        toast.warning('Koneksi terputus. Mencoba menghubungkan kembali...', { duration: 3000 });
      }
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('❌ WebSocket connection error:', error.message);
      setIsConnected(false);
      setConnectionError(error.message);
      
      const attempts = reconnectAttempts + 1;
      setReconnectAttempts(attempts);
      
      if (attempts === 1) {
        toast.error('Gagal terhubung ke server');
      } else if (attempts === 5) {
        toast.error('Masih mencoba terhubung... Periksa koneksi internet Anda.');
      }
    });

    // Metrics update handler
    newSocket.on('metrics:update', (data: DashboardMetrics) => {
      console.log('📊 Metrics update received:', data);
      setLastUpdate(new Date());
      
      // Update React Query cache
      queryClient.setQueryData(['dashboard-metrics'], (old: any) => ({
        ...old,
        ...data,
      }));

      // Call custom handler if provided
      onMetricsUpdate?.(data);
    });

    // Alert handler
    newSocket.on('alert:new', (alert: DashboardAlert) => {
      console.log('🚨 Alert received:', alert);
      
      // Add new alert to cache
      queryClient.setQueryData(['dashboard-alerts'], (old: DashboardAlert[] = []) => 
        [alert, ...old]
      );

      // Show toast notification based on severity
      const toastOptions = {
        duration: alert.severity === 'CRITICAL' ? 10000 : 5000,
      };

      switch (alert.severity) {
        case 'CRITICAL':
          toast.error(alert.message, toastOptions);
          break;
        case 'WARNING':
          toast.warning(alert.message, toastOptions);
          break;
        case 'INFO':
          toast.info(alert.message, toastOptions);
          break;
      }

      // Call custom handler if provided
      onAlert?.(alert);
    });

    // Reconnection handlers
    newSocket.on('reconnect', (attemptNumber: number) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
      setReconnectAttempts(0);
      setConnectionError(null);
      toast.success('Dashboard terhubung kembali');
    });

    newSocket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('🔄 Reconnection attempt', attemptNumber);
      setReconnectAttempts(attemptNumber);
      
      // Update delay for next attempt using exponential backoff
      const delay = getReconnectDelay(attemptNumber);
      newSocket.io.opts.reconnectionDelay = delay;
    });

    newSocket.on('reconnect_error', (error: Error) => {
      console.error('❌ Reconnection error:', error.message);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Failed to reconnect after maximum attempts');
      setConnectionError('Unable to connect to server');
      toast.error('Gagal terhubung ke dashboard real-time. Silakan refresh halaman.');
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Closing WebSocket connection');
      newSocket.close();
    };
  }, [enabled, unitIds, metrics, queryClient, getAccessToken, onMetricsUpdate, onAlert, getReconnectDelay, reconnectAttempts]);

  // Manual subscription update
  const updateSubscription = useCallback((newUnitIds: string[], newMetrics: string[]) => {
    if (socket && isConnected) {
      socket.emit('dashboard:subscribe', {
        unitIds: newUnitIds,
        metrics: newMetrics,
      });
    }
  }, [socket, isConnected]);

  // Manual disconnect
  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (socket && !isConnected) {
      console.log('🔄 Manual reconnect triggered');
      setReconnectAttempts(0);
      socket.connect();
    }
  }, [socket, isConnected]);

  // Subscribe to specific unit
  const subscribeToUnit = useCallback((unitId: string) => {
    if (socket && isConnected) {
      socket.emit('subscribe:unit-dashboard', { unitId });
    }
  }, [socket, isConnected]);

  return {
    socket,
    isConnected,
    lastUpdate,
    reconnectAttempts,
    connectionError,
    updateSubscription,
    disconnect,
    reconnect,
    subscribeToUnit,
  };
}

// Hook for dashboard alerts with pagination
export function useDashboardAlerts(params: { page?: number; limit?: number } = {}) {
  const { page = 1, limit = 20 } = params;
  
  return useQueryClient().getQueryData<DashboardAlert[]>(['dashboard-alerts']) || [];
}
