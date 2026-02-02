import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PerformanceReview, useCreatePerformanceReview, useUpdatePerformanceReview } from "@/hooks/use-talent";
import { useEffect } from "react";
import { toast } from "sonner";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployees } from "@/hooks/use-hr";

const schema = z.object({
  userId: z.string().min(1, "Employee is required"),
  reviewerId: z.string().min(1, "Reviewer is required"),
  cycleName: z.string().min(2, "Cycle Name is required"),
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
  goals: z.string().optional(),
});

interface ReviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review?: PerformanceReview | null;
}

export function ReviewForm({ open, onOpenChange, review }: ReviewFormProps) {
  const createMutation = useCreatePerformanceReview();
  const updateMutation = useUpdatePerformanceReview();
  const { data: employeesData } = useEmployees({ limit: 100 }); // Ideally should search
  const employees = employeesData?.data || [];

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      userId: "",
      reviewerId: "",
      cycleName: "",
      dateRange: { from: new Date(), to: new Date() },
      goals: "",
    },
  });

  useEffect(() => {
    if (review) {
      form.reset({
        userId: review.userId,
        reviewerId: review.reviewerId,
        cycleName: review.cycleName,
        dateRange: {
          from: new Date(review.startDate),
          to: new Date(review.endDate),
        },
        goals: review.goals || "",
      });
    } else {
      form.reset({
        userId: "",
        reviewerId: "",
        cycleName: "",
        dateRange: { from: new Date(), to: new Date() },
        goals: "",
      });
    }
  }, [review, form, open]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    const payload = {
      ...values,
      startDate: values.dateRange.from.toISOString(),
      endDate: values.dateRange.to.toISOString(),
    };

    try {
      if (review) {
        await updateMutation.mutateAsync({ id: review.id, data: payload });
        toast.success("Review updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Review created");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save review");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{review ? "Edit Review Cycle" : "Create Review Cycle"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cycleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cycle Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Q1 2025 Performance Review" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!review}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map(emp => (
                          <SelectItem key={emp.userId} value={emp.userId || ""}>
                            {emp.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reviewerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reviewer</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reviewer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map(emp => (
                          <SelectItem key={emp.userId} value={emp.userId || ""}>
                            {emp.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Review Period</FormLabel>
                  <DatePickerWithRange
                    date={field.value}
                    setDate={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Goals / KPIs</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Define main goals for this period..." className="h-32" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
