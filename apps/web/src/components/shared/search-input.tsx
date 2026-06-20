"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  placeholder = "Search...",
  value: externalValue,
  onChange,
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(externalValue || "");
  const isFirstRender = useRef(true);

  // Sync internal value when the external (controlled) value changes.
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
    setInternalValue("");
    onChangeRef.current("");
  }, []);

  return (
    <div className={cn("relative", className)}>
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
