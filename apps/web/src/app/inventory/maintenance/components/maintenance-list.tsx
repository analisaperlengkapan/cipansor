"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useMaintenances,
  useUpdateMaintenanceStatus,
  AssetMaintenance,
  AssetMaintenanceStatus,
} from "@/hooks/use-inventory";
import { format } from "date-fns";
import { Loader2, CheckCircle, XCircle, Wrench } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Pagination } from "@/components/shared/pagination";

export function MaintenanceList() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { data, isLoading } = useMaintenances({ page, limit });
  const { mutateAsync: updateStatus } = useUpdateMaintenanceStatus();

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleStatusUpdate = async (
    id: string,
    status: AssetMaintenanceStatus,
  ) => {
    try {
      await updateStatus({ id, data: { status } });
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Asset</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested By</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.data.map((item: AssetMaintenance) => (
            <TableRow key={item.id}>
              <TableCell>
                {format(new Date(item.maintenanceDate), "dd MMM yyyy")}
              </TableCell>
              <TableCell>
                <div className="font-medium">{item.asset?.name}</div>
                <div className="text-xs text-muted-foreground">
                  {item.asset?.code}
                </div>
              </TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell
                className="max-w-[300px] truncate"
                title={item.description}
              >
                {item.description}
              </TableCell>
              <TableCell>
                <Badge
                  className={getStatusColor(item.status)}
                  variant="outline"
                >
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>
                {item.requestedBy?.name || item.performedBy}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => navigator.clipboard.writeText(item.id)}
                    >
                      Copy ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {item.status === "PENDING" && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusUpdate(
                              item.id,
                              AssetMaintenanceStatus.APPROVED,
                            )
                          }
                        >
                          <CheckCircle className="mr-2 h-4 w-4" /> Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusUpdate(
                              item.id,
                              AssetMaintenanceStatus.REJECTED,
                            )
                          }
                        >
                          <XCircle className="mr-2 h-4 w-4" /> Reject
                        </DropdownMenuItem>
                      </>
                    )}
                    {item.status === "APPROVED" && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleStatusUpdate(
                            item.id,
                            AssetMaintenanceStatus.IN_PROGRESS,
                          )
                        }
                      >
                        <Wrench className="mr-2 h-4 w-4" /> Start Work
                      </DropdownMenuItem>
                    )}
                    {item.status === "IN_PROGRESS" && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleStatusUpdate(
                            item.id,
                            AssetMaintenanceStatus.COMPLETED,
                          )
                        }
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Complete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {data?.data.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No maintenance records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination
        page={data?.meta.page || 1}
        totalPages={data?.meta.totalPages || 1}
        total={data?.meta.total || 0}
        onPageChange={setPage}
        onPageSizeChange={setLimit}
      />
    </div>
  );
}
