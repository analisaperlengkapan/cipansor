/**
 * useURLFilters Hook
 * Persists filter state in URL parameters
 */

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

type FilterValue = string | number | boolean | null | undefined;

interface UseURLFiltersOptions {
  defaultValues?: Record<string, FilterValue>;
  debounceMs?: number;
}

export function useURLFilters<T extends Record<string, FilterValue>>(
  options: UseURLFiltersOptions = {},
) {
  const { defaultValues = {} } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse current filters from URL
  const filters = useMemo(() => {
    const result: Record<string, FilterValue> = { ...defaultValues };
    searchParams.forEach((value, key) => {
      // Try to parse as number or boolean
      if (value === "true") {
        result[key] = true;
      } else if (value === "false") {
        result[key] = false;
      } else if (!isNaN(Number(value)) && value !== "") {
        result[key] = Number(value);
      } else {
        result[key] = value;
      }
    });
    return result as T;
  }, [searchParams, defaultValues]);

  // Set a single filter
  const setFilter = useCallback(
    (key: string, value: FilterValue) => {
      const params = new URLSearchParams(searchParams.toString());

      if (
        value === null ||
        value === undefined ||
        value === "" ||
        value === defaultValues[key]
      ) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }

      // Reset page when filters change
      if (key !== "page") {
        params.delete("page");
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams, defaultValues],
  );

  // Set multiple filters at once
  const setFilters = useCallback(
    (newFilters: Partial<T>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newFilters).forEach(([key, value]) => {
        if (
          value === null ||
          value === undefined ||
          value === "" ||
          value === defaultValues[key]
        ) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      // Reset page when filters change
      params.delete("page");

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams, defaultValues],
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return Array.from(searchParams.entries()).some(([key, value]) => {
      return key !== "page" && value !== String(defaultValues[key]);
    });
  }, [searchParams, defaultValues]);

  return {
    filters,
    setFilter,
    setFilters,
    clearFilters,
    hasActiveFilters,
  };
}

// Specific hook for pagination
export function useURLPagination(defaultPageSize = 10) {
  const { filters, setFilter } = useURLFilters({
    defaultValues: { page: 1, limit: defaultPageSize },
  });

  return {
    page: Number(filters.page) || 1,
    limit: Number(filters.limit) || defaultPageSize,
    setPage: (page: number) => setFilter("page", page),
    setPageSize: (size: number) => setFilter("limit", size),
  };
}
