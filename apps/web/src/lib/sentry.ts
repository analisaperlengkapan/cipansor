import * as Sentry from '@sentry/nextjs';
import { ErrorInfo } from 'react';

/**
 * Centralized error capturing for Sentry.
 * Only logs in production environment.
 */
export const captureError = (error: unknown, errorInfo?: ErrorInfo) => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      contexts: errorInfo ? { react: { componentStack: errorInfo.componentStack } } : undefined,
    });
  }
};
