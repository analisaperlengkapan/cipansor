"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useStudentSearch } from "@/hooks/use-students";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface StudentSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  unitId?: string;
  className?: string;
}

export function StudentSelect({
  value,
  onValueChange,
  unitId,
  className,
}: StudentSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Search query
  const { data: students, isLoading } = useStudentSearch(debouncedSearch, unitId);

  // Find selected student details from search results
  // Note: If this is used for editing and the student isn't in search results,
  // the name might not show up correctly without a separate useStudent(value) call.
  // For 'Create' flow, this is acceptable.
  const selectedStudent = students?.find((student) => student.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value
            ? (selectedStudent?.name || "Santri Terpilih")
            : "Pilih santri..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Cari nama santri..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
                {isLoading ? "Mencari..." : "Santri tidak ditemukan."}
            </CommandEmpty>
            <CommandGroup>
              {students?.map((student) => (
                <CommandItem
                  key={student.id}
                  value={student.name}
                  onSelect={() => {
                    onValueChange(student.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === student.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col text-left">
                    <span className="font-medium">{student.name}</span>
                    <span className="text-xs text-muted-foreground">{student.nis} - {student.unit?.name || "-"}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
