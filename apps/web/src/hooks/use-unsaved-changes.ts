'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UseUnsavedChangesOptions {
  /**
   * Whether tracking is enabled
   */
  enabled?: boolean;
  /**
   * Warning message to show
   */
  message?: string;
  /**
   * Callback when user tries to navigate away
   */
  onNavigationAttempt?: () => void;
}

interface UseUnsavedChangesReturn {
  /**
   * Whether there are unsaved changes
   */
  hasChanges: boolean;
  /**
   * Mark as having changes
   */
  setHasChanges: (value: boolean) => void;
  /**
   * Track a form value for changes
   */
  trackValue: <T>(current: T, initial: T) => void;
  /**
   * Reset tracking (after save)
   */
  reset: () => void;
  /**
   * Confirm navigation (allow leaving)
   */
  confirmNavigation: () => void;
}

/**
 * Hook to track unsaved changes and warn before navigation
 * 
 * @example
 * ```tsx
 * function EditForm() {
 *   const [name, setName] = useState(initialName);
 *   const { hasChanges, setHasChanges, reset } = useUnsavedChanges();
 * 
 *   useEffect(() => {
 *     setHasChanges(name !== initialName);
 *   }, [name, initialName]);
 * 
 *   const handleSave = async () => {
 *     await save();
 *     reset();
 *   };
 * 
 *   return (
 *     <form>
 *       <input value={name} onChange={e => setName(e.target.value)} />
 *       {hasChanges && <span>Ada perubahan yang belum disimpan</span>}
 *     </form>
 *   );
 * }
 * ```
 */
export function useUnsavedChanges(
  options: UseUnsavedChangesOptions = {}
): UseUnsavedChangesReturn {
  const {
    enabled = true,
    message = 'Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman ini?',
    onNavigationAttempt,
  } = options;

  const [hasChanges, setHasChanges] = useState(false);
  const allowNavigationRef = useRef(false);
  const router = useRouter();

  // Handle browser beforeunload event
  useEffect(() => {
    if (!enabled || !hasChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (allowNavigationRef.current) return;
      
      e.preventDefault();
      // Modern browsers require returnValue to be set
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, hasChanges, message]);

  // Handle Next.js route changes
  useEffect(() => {
    if (!enabled || !hasChanges) return;

    const handleRouteChange = () => {
      if (allowNavigationRef.current) {
        allowNavigationRef.current = false;
        return true;
      }

      onNavigationAttempt?.();

      const confirmed = window.confirm(message);
      if (!confirmed) {
        // Cancel navigation by throwing
        throw new Error('Navigation cancelled by user');
      }
      return true;
    };

    // For App Router, we need to use a different approach
    // We can patch the router.push method
    const originalPush = router.push;
    router.push = (...args) => {
      try {
        handleRouteChange();
        return originalPush.apply(router, args);
      } catch {
        // Navigation was cancelled
        return Promise.resolve(false as unknown as boolean);
      }
    };

    return () => {
      router.push = originalPush;
    };
  }, [enabled, hasChanges, message, onNavigationAttempt, router]);

  // Track value changes
  const trackValue = useCallback(<T>(current: T, initial: T) => {
    const isDifferent = JSON.stringify(current) !== JSON.stringify(initial);
    setHasChanges(isDifferent);
  }, []);

  // Reset tracking
  const reset = useCallback(() => {
    setHasChanges(false);
    allowNavigationRef.current = false;
  }, []);

  // Allow navigation without warning
  const confirmNavigation = useCallback(() => {
    allowNavigationRef.current = true;
  }, []);

  return {
    hasChanges,
    setHasChanges,
    trackValue,
    reset,
    confirmNavigation,
  };
}

/**
 * Simple hook to track if a form has been modified
 */
export function useFormDirty<T>(initialValues: T, currentValues: T): boolean {
  return JSON.stringify(initialValues) !== JSON.stringify(currentValues);
}
