import * as Sentry from '@sentry/nextjs';
import { ErrorInfo } from 'react';
import { parseApiError } from './api-error';

export const captureError = (error: unknown, errorInfo?: ErrorInfo) => {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  // Parse error using shared logic
  const parsedError = parseApiError(error);

  Sentry.withScope((scope) => {
    // Add React component stack if available
    if (errorInfo) {
      scope.setContext('react', { componentStack: errorInfo.componentStack });
    }

    // Add API error context if applicable
    if (parsedError.statusCode > 0 || parsedError.code) {
      scope.setTag('api.status_code', parsedError.statusCode);
      scope.setTag('api.is_network_error', parsedError.isNetworkError);

      if (parsedError.code) {
        scope.setTag('api.code', parsedError.code);
      }

      scope.setContext('api_error', {
        title: parsedError.title,
        message: parsedError.message,
        details: parsedError.details,
        isRetryable: parsedError.retry,
      });
    }

    // Capture the original error
    Sentry.captureException(error);
  });
};
