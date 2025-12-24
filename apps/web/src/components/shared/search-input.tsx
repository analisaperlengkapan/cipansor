'use client';

import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback, useRef } from 'react';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export function SearchInput({
  placeholder = 'Search...',
  value: externalValue,
  onChange,
  debounceMs = 300,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(externalValue || '');
  const isFirstRender = useRef(true);
  // Store previous external value to check for changes
  const prevExternalValueRef = useRef(externalValue);

  // Update internal value when external value changes, but only if different
  // We use a ref to track if this specific instance of the value has been processed
  if (externalValue !== undefined && externalValue !== prevExternalValueRef.current) {
    prevExternalValueRef.current = externalValue;
    // We can update state during render if it's based on props change (derived state pattern)
    // However, since we also allow user input to change it, it's safer to just set it here if we accept
    // that external updates override internal state.
    // Ideally, for controlled components, we shouldn't have local state unless for debouncing.
    // Here we have local state for debouncing.

    // To avoid "set state during render" warning if not handled carefully or "set state in effect",
    // we can use the pattern of checking in render and updating state, but that triggers re-render immediately.
    // OR we can just use key prop on the component usage to reset state when key changes.
    // BUT, for this component, let's stick to useEffect but be careful.
  }

  useEffect(() => {
      if (externalValue !== undefined && externalValue !== internalValue) {
          setInternalValue(externalValue);
      }
      // We only want to run this when externalValue changes, not internalValue
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalValue]);

  // Stable onChange callback - wrapped in useRef to avoid re-creation
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    // Skip the first render to avoid firing onChange immediately
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Only fire onChange if internal value differs from external (if provided)
    // or always if we are treating this as internal state driver

    const timer = setTimeout(() => {
        onChangeRef.current(internalValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, debounceMs]);

  const handleClear = useCallback(() => {
    setInternalValue('');
    onChangeRef.current('');
  }, []);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        className="pl-9 pr-9"
      />
      {internalValue && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
