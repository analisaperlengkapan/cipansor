'use client';

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  /**
   * Unique identifier for the shortcut
   */
  id: string;
  /**
   * Key combination (e.g., 'ctrl+s', 'ctrl+shift+n', 'escape')
   */
  keys: string;
  /**
   * Handler function
   */
  handler: (event: KeyboardEvent) => void;
  /**
   * Description of what the shortcut does (for help menu)
   */
  description?: string;
  /**
   * Whether the shortcut is enabled
   */
  enabled?: boolean;
  /**
   * Prevent default browser behavior
   */
  preventDefault?: boolean;
  /**
   * Allow in input elements
   */
  allowInInput?: boolean;
}

interface UseKeyboardShortcutsOptions {
  /**
   * Whether shortcuts are globally enabled
   */
  enabled?: boolean;
}

/**
 * Parse key combination string into components
 */
function parseKeyCombo(keys: string): {
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
} {
  const parts = keys.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  
  return {
    key,
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command'),
  };
}

/**
 * Check if event matches key combination
 */
function matchesKeyCombo(
  event: KeyboardEvent,
  combo: ReturnType<typeof parseKeyCombo>
): boolean {
  const eventKey = event.key.toLowerCase();
  
  // Handle special keys
  const keyMatch = 
    eventKey === combo.key ||
    (combo.key === 'escape' && eventKey === 'escape') ||
    (combo.key === 'enter' && eventKey === 'enter') ||
    (combo.key === 'space' && (eventKey === ' ' || eventKey === 'space')) ||
    (combo.key === 'tab' && eventKey === 'tab') ||
    (combo.key === 'backspace' && eventKey === 'backspace') ||
    (combo.key === 'delete' && eventKey === 'delete') ||
    (combo.key === 'arrowup' && eventKey === 'arrowup') ||
    (combo.key === 'arrowdown' && eventKey === 'arrowdown') ||
    (combo.key === 'arrowleft' && eventKey === 'arrowleft') ||
    (combo.key === 'arrowright' && eventKey === 'arrowright');

  return (
    keyMatch &&
    event.ctrlKey === combo.ctrl &&
    event.shiftKey === combo.shift &&
    event.altKey === combo.alt &&
    event.metaKey === combo.meta
  );
}

/**
 * Check if event target is an input element
 */
function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  
  const tagName = target.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  const isContentEditable = target.isContentEditable;
  
  return isInput || isContentEditable;
}

/**
 * Hook to manage keyboard shortcuts
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();
 * 
 *   useEffect(() => {
 *     registerShortcut({
 *       id: 'save',
 *       keys: 'ctrl+s',
 *       handler: () => handleSave(),
 *       description: 'Simpan',
 *       preventDefault: true,
 *     });
 * 
 *     return () => unregisterShortcut('save');
 *   }, []);
 * }
 * ```
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true } = options;
  const shortcutsRef = useRef<Map<string, KeyboardShortcut>>(new Map());

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    shortcutsRef.current.set(shortcut.id, {
      ...shortcut,
      enabled: shortcut.enabled ?? true,
      preventDefault: shortcut.preventDefault ?? true,
      allowInInput: shortcut.allowInInput ?? false,
    });
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    shortcutsRef.current.delete(id);
  }, []);

  const getShortcuts = useCallback(() => {
    return Array.from(shortcutsRef.current.values());
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isInput = isInputElement(event.target);

      for (const shortcut of shortcutsRef.current.values()) {
        if (!shortcut.enabled) continue;
        if (isInput && !shortcut.allowInInput) continue;

        const combo = parseKeyCombo(shortcut.keys);
        
        if (matchesKeyCombo(event, combo)) {
          if (shortcut.preventDefault) {
            event.preventDefault();
          }
          shortcut.handler(event);
          break; // Only trigger first matching shortcut
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);

  return {
    registerShortcut,
    unregisterShortcut,
    getShortcuts,
  };
}

/**
 * Simple hook for a single keyboard shortcut
 * 
 * @example
 * ```tsx
 * useKeyboardShortcut('ctrl+s', handleSave, { preventDefault: true });
 * useKeyboardShortcut('escape', handleClose);
 * ```
 */
export function useKeyboardShortcut(
  keys: string,
  handler: (event: KeyboardEvent) => void,
  options: {
    enabled?: boolean;
    preventDefault?: boolean;
    allowInInput?: boolean;
  } = {}
) {
  const {
    enabled = true,
    preventDefault = true,
    allowInInput = false,
  } = options;

  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    const combo = parseKeyCombo(keys);

    const handleKeyDown = (event: KeyboardEvent) => {
      const isInput = isInputElement(event.target);
      if (isInput && !allowInInput) return;

      if (matchesKeyCombo(event, combo)) {
        if (preventDefault) {
          event.preventDefault();
        }
        handlerRef.current(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [keys, enabled, preventDefault, allowInInput]);
}

/**
 * Format key combination for display
 */
export function formatKeyCombo(keys: string): string {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  
  return keys
    .split('+')
    .map(key => {
      const lower = key.toLowerCase();
      if (lower === 'ctrl' || lower === 'control') return isMac ? '⌃' : 'Ctrl';
      if (lower === 'shift') return isMac ? '⇧' : 'Shift';
      if (lower === 'alt') return isMac ? '⌥' : 'Alt';
      if (lower === 'meta' || lower === 'cmd' || lower === 'command') return isMac ? '⌘' : 'Win';
      if (lower === 'escape') return 'Esc';
      if (lower === 'enter') return '↵';
      if (lower === 'space') return 'Space';
      if (lower === 'backspace') return '⌫';
      if (lower === 'delete') return 'Del';
      if (lower === 'arrowup') return '↑';
      if (lower === 'arrowdown') return '↓';
      if (lower === 'arrowleft') return '←';
      if (lower === 'arrowright') return '→';
      return key.toUpperCase();
    })
    .join(isMac ? '' : '+');
}
