"use client";
import { useState } from "react";
import { safeFormat } from "@/lib/date";
import { useRouter } from "next/navigation";
import {
  usePayrollPeriods,
  useCreatePayrollPeriod,
  useGeneratePayrollSlips,
  PAYROLL_PERIOD_STATUS_LABELS,
} from "@/hooks/use-hr";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ArrowRight, RefreshCw } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function PayrollPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading } = usePayrollPeriods({
    page,
    limit: 10,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
        <GeneratePayrollDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Periods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period Name</TableHead>
                  <TableHead>Month/Year</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : data?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No payroll periods found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data?.map((period) => (
                    <TableRow
                      key={period.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/hr/payroll/${period.id}`)}
                    >
                      <TableCell className="font-medium">
                        {period.name}
                      </TableCell>
                      <TableCell>
                        {period.month}/{period.year}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {safeFormat(new Date(period.startDate), "MMM d")} -{" "}
                          {safeFormat(new Date(period.endDate), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            period.status === "CLOSED" ? "secondary" : "default"
                          }
                        >
                          {
                            PAYROLL_PERIOD_STATUS_LABELS[
                              period.status as keyof typeof PAYROLL_PERIOD_STATUS_LABELS
                            ]
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>{period._count?.payrolls || 0}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GeneratePayrollDialog() {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [step, setStep] = useState<"CREATE" | "GENERATE">("CREATE");
  const [periodId, setPeriodId] = useState<string | null>(null);

  const createPeriodMutation = useCreatePayrollPeriod();
  const generateSlipsMutation = useGeneratePayrollSlips();

  const handleCreate = async () => {
    try {
      const res: any = await createPeriodMutation.mutateAsync({
        name: `Payroll ${new Date(0, parseInt(month) - 1).toLocaleString("default", { month: "long" })} ${year}`,
        month: parseInt(month),
        year: parseInt(year),
        startDate: new Date(
          parseInt(year),
          parseInt(month) - 1,
          1,
        ).toISOString(),
        endDate: new Date(parseInt(year), parseInt(month), 0).toISOString(),
      });
      setPeriodId(res.id);
      setStep("GENERATE");
      toast.info("Period Created. Now generating slips...");

      // Auto trigger generation? Or let user click?
      // Let's auto trigger for better UX
      await handleGenerate(res.id);
    } catch (error: any) {
      // If error is "Unique constraint", it means period exists.
      // We should probably handle this gracefully or ask to use existing.
      toast.error("Failed to create period. It might already exist.");
    }
  };

  const handleGenerate = async (id: string) => {
    try {
      await generateSlipsMutation.mutateAsync({
        periodId: id,
        overwrite: true, // Default to true for new generation
      });
      toast.success("Payroll slips generated successfully");
      setOpen(false);
      setStep("CREATE");
    } catch (error) {
      toast.error("Failed to generate slips");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Payroll
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Payroll</DialogTitle>
          <DialogDescription>
            Create a new payroll period and generate slips for all eligible
            employees.
          </DialogDescription>
        </DialogHeader>

        {step === "CREATE" ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {new Date(0, m - 1).toLocaleString("default", {
                          month: "long",
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Generating slips...</p>
          </div>
        )}

        <DialogFooter>
          {step === "CREATE" && (
            <Button
              onClick={handleCreate}
              disabled={createPeriodMutation.isPending}
            >
              {createPeriodMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create & Generate"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
