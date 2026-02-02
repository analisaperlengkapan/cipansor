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
import { TrainingProgram, useCreateTrainingProgram, useUpdateTrainingProgram } from "@/hooks/use-talent";
import { useEffect } from "react";
import { toast } from "sonner";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  provider: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
  hours: z.coerce.number().optional(),
  cost: z.coerce.number().optional(),
});

interface TrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: TrainingProgram | null;
}

export function TrainingDialog({ open, onOpenChange, program }: TrainingDialogProps) {
  const createMutation = useCreateTrainingProgram();
  const updateMutation = useUpdateTrainingProgram();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      provider: "",
      description: "",
      location: "",
      dateRange: { from: new Date(), to: new Date() },
      hours: 0,
      cost: 0,
    },
  });

  useEffect(() => {
    if (program) {
      form.reset({
        name: program.name,
        provider: program.provider || "",
        description: program.description || "",
        location: program.location || "",
        dateRange: {
          from: new Date(program.startDate),
          to: new Date(program.endDate),
        },
        hours: program.hours || 0,
        cost: program.cost || 0,
      });
    } else {
      form.reset({
        name: "",
        provider: "",
        description: "",
        location: "",
        dateRange: { from: new Date(), to: new Date() },
        hours: 0,
        cost: 0,
      });
    }
  }, [program, form, open]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    const payload = {
      ...values,
      startDate: values.dateRange.from.toISOString(),
      endDate: values.dateRange.to.toISOString(),
    };

    try {
      if (program) {
        await updateMutation.mutateAsync({ id: program.id, data: payload });
        toast.success("Training program updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Training program created");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save training program");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{program ? "Edit Program" : "Add Program"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Coursera, Internal" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Online, Meeting Room A" />
                    </FormControl>
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
                  <FormLabel>Dates</FormLabel>
                  <DatePickerWithRange
                    date={field.value}
                    setDate={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (Hours)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost (IDR)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
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
