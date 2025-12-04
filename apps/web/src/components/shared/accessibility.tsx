'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps extends React.HTMLAttributes<HTMLAnchorElement> {
  /**
   * Target element ID to skip to
   */
  targetId?: string;
  /**
   * Text to display in the link
   */
  children?: React.ReactNode;
}

/**
 * Skip Link component for accessibility
 * Allows keyboard users to skip navigation and go directly to main content
 * 
 * @example
 * ```tsx
 * // In layout.tsx
 * <SkipLink />
 * <header>...</header>
 * <main id="main-content">...</main>
 * 
 * // With custom target
 * <SkipLink targetId="content">Skip to content</SkipLink>
 * ```
 */
export function SkipLink({
  targetId = 'main-content',
  children = 'Loncat ke konten utama',
  className,
  ...props
}: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    
    if (target) {
      // Make target focusable if it isn't
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus();
      target.scrollIntoView();
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={cn(
        // Position
        'fixed left-4 top-4 z-[100]',
        // By default, visually hidden but keyboard-accessible
        'sr-only focus:not-sr-only',
        // Styles when focused
        'focus:absolute focus:z-50',
        'focus:bg-primary focus:text-primary-foreground',
        'focus:px-4 focus:py-2 focus:rounded-md',
        'focus:shadow-lg focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'focus:outline-none',
        // Animation
        'transition-all duration-150',
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}

interface FocusTrapProps {
  /**
   * Whether the focus trap is active
   */
  active?: boolean;
  /**
   * Children to wrap
   */
  children: React.ReactNode;
  /**
   * Callback when escape is pressed
   */
  onEscape?: () => void;
  /**
   * Return focus to this element when deactivated
   */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Focus Trap component for modals and dialogs
 * Traps focus within the container for accessibility
 * 
 * @example
 * ```tsx
 * <FocusTrap active={isOpen} onEscape={close}>
 *   <Dialog>...</Dialog>
 * </FocusTrap>
 * ```
 */
export function FocusTrap({
  active = true,
  children,
  onEscape,
  returnFocusRef,
}: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!active) return;

    // Store previously focused element
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element
    const container = containerRef.current;
    if (container) {
      const focusableElements = getFocusableElements(container);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    return () => {
      // Return focus when deactivated
      const returnTo = returnFocusRef?.current ?? previousActiveElementRef.current;
      if (returnTo && typeof returnTo.focus === 'function') {
        returnTo.focus();
      }
    };
  }, [active, returnFocusRef]);

  React.useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      // Handle Tab
      if (e.key === 'Tab') {
        const container = containerRef.current;
        if (!container) return;

        const focusableElements = getFocusableElements(container);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: move to last element if at first
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: move to first element if at last
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, onEscape]);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    el => !el.hasAttribute('disabled') && el.offsetParent !== null
  );
}

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * When true, content becomes visible for debugging
   */
  debug?: boolean;
}

/**
 * Visually Hidden component for screen reader text
 * 
 * @example
 * ```tsx
 * <button>
 *   <Icon name="close" />
 *   <VisuallyHidden>Tutup dialog</VisuallyHidden>
 * </button>
 * ```
 */
export function VisuallyHidden({
  children,
  debug = false,
  className,
  ...props
}: VisuallyHiddenProps) {
  return (
    <span
      className={cn(debug ? '' : 'sr-only', className)}
      {...props}
    >
      {children}
    </span>
  );
}

interface LiveRegionProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Politeness level for announcements
   */
  politeness?: 'polite' | 'assertive';
  /**
   * Whether to announce only when content changes
   */
  atomic?: boolean;
  /**
   * Content to announce
   */
  children: React.ReactNode;
}

/**
 * Live Region component for screen reader announcements
 * 
 * @example
 * ```tsx
 * <LiveRegion politeness="polite">
 *   {message && `${count} hasil ditemukan`}
 * </LiveRegion>
 * ```
 */
export function LiveRegion({
  politeness = 'polite',
  atomic = true,
  children,
  className,
  ...props
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className={cn('sr-only', className)}
      {...props}
    >
      {children}
    </div>
  );
}
