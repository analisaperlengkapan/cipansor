"use client";

import { useState } from "react";
import { useEmployees } from "@/hooks/use-employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Loader2, MoreHorizontal, Edit, Trash, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteEmployee } from "@/hooks/use-employees";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { useUnits } from "@/hooks/use-units";

export default function EmployeesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [roleFilter, setRoleFilter] = useState<"ALL" | "TEACHER" | "STAFF">("ALL");
  const [unitFilter, setUnitFilter] = useState<string>("ALL");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: unitsData } = useUnits();
  const { data, isLoading, isError } = useEmployees({
    page,
    limit: 10,
    search: debouncedSearch,
    role: roleFilter === "ALL" ? undefined : roleFilter,
    unitId: unitFilter === "ALL" ? undefined : unitFilter,
  });

  const deleteMutation = useDeleteEmployee();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast({ title: "Success", description: "Employee deleted successfully" });
      setDeleteId(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete employee", variant: "destructive" });
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (data?.meta?.totalPages || 1)) {
      setPage(newPage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
        <Button asChild>
          <Link href="/hr/employees/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, NIP, or email..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(val: any) => setRoleFilter(val)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="TEACHER">Guru (Teacher)</SelectItem>
                <SelectItem value="STAFF">Tendik (Staff)</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={unitFilter}
              onValueChange={setUnitFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Units</SelectItem>
                {unitsData?.data?.map((unit: any) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>NIP / NUPTK</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-destructive py-8">
                      Failed to load employees
                    </TableCell>
                  </TableRow>
                ) : data?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No employees found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data?.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground">{employee.email}</div>
                      </TableCell>
                      <TableCell>
                        {employee.role === "TEACHER" ? (
                           <div className="flex flex-col">
                             <span>NIP: {employee.teacher?.nip || "-"}</span>
                             <span className="text-xs text-muted-foreground">NUPTK: {employee.teacher?.nuptk || "-"}</span>
                           </div>
                        ) : (
                          <span>NIP: {employee.staff?.nip || "-"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={employee.role === "TEACHER" ? "default" : "secondary"}>
                          {employee.role}
                        </Badge>
                        {employee.role === "STAFF" && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {employee.staff?.position}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{employee.unit?.name}</TableCell>
                      <TableCell>
                        <Badge variant={employee.isActive ? "outline" : "destructive"}>
                          {employee.isActive ? "Active" : "Inactive"}
                        </Badge>
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
                            <DropdownMenuItem onClick={() => router.push(`/hr/employees/${employee.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(employee.id)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {data?.meta && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} records)
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= data.meta.totalPages || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
