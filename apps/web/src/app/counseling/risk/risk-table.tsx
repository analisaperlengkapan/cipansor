"use client";

import { StudentRiskProfile } from "./types";
import { DataTable } from "@/components/shared/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, FilePlus, User } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  data: StudentRiskProfile[];
  isLoading: boolean;
}

const columns: ColumnDef<StudentRiskProfile>[] = [
  {
    accessorKey: "studentName",
    header: "Student",
    cell: ({ row }) => (
        <div>
            <div className="font-medium">{row.original.studentName}</div>
            <div className="text-xs text-muted-foreground">{row.original.className}</div>
        </div>
    )
  },
  {
    accessorKey: "riskScore",
    header: "Risk Score",
    cell: ({ row }) => {
        const score = row.original.riskScore;
        let color = "bg-green-100 text-green-800";
        if (score >= 80) color = "bg-red-100 text-red-800";
        else if (score >= 50) color = "bg-orange-100 text-orange-800";
        else if (score >= 20) color = "bg-yellow-100 text-yellow-800";

        return <Badge className={color}>{score}</Badge>;
    }
  },
  {
    id: "breakdown",
    header: "Breakdown (Pts)",
    cell: ({ row }) => {
        const d = row.original.details;
        return (
            <div className="flex gap-2 text-xs">
                <span title="Behavior Risk" className="text-purple-600 font-medium">B: {d.behavior.riskContribution}</span>
                <span title="Academic Risk" className="text-blue-600 font-medium">A: {d.academic.riskContribution}</span>
                <span title="Financial Risk" className="text-emerald-600 font-medium">F: {d.financial.riskContribution}</span>
                <span title="Attendance Risk" className="text-orange-600 font-medium">Att: {d.attendance.riskContribution}</span>
            </div>
        )
    }
  },
  {
    accessorKey: "riskLevel",
    header: "Level",
    cell: ({ row }) => <Badge variant="outline">{row.original.riskLevel}</Badge>
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/counseling/new?studentId=${row.original.studentId}&risk=true`}>
              <FilePlus className="h-4 w-4 mr-2" />
              Create Counseling Case
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/students/${row.original.studentId}`}>
              <User className="h-4 w-4 mr-2" />
              View Profile
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function StudentRiskTable({ data, isLoading }: Props) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="studentName"
      isLoading={isLoading}
    />
  );
}
