import * as Sentry from '@sentry/nextjs';
import { ErrorInfo } from 'react';

export const captureError = (error: unknown, errorInfo?: ErrorInfo) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      contexts: errorInfo ? { react: { componentStack: errorInfo.componentStack } } : undefined,
    });
  }
};
