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
import { Competency, useCreateCompetency, useUpdateCompetency } from "@/hooks/use-talent";
import { useEffect } from "react";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
});

interface CompetencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competency?: Competency | null;
}

export function CompetencyDialog({ open, onOpenChange, competency }: CompetencyDialogProps) {
  const createMutation = useCreateCompetency();
  const updateMutation = useUpdateCompetency();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
    },
  });

  useEffect(() => {
    if (competency) {
      form.reset({
        name: competency.name,
        description: competency.description || "",
        category: competency.category || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        category: "",
      });
    }
  }, [competency, form, open]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      if (competency) {
        await updateMutation.mutateAsync({ id: competency.id, data: values });
        toast.success("Competency updated successfully");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Competency created successfully");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save competency");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{competency ? "Edit Competency" : "Add Competency"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Technical, Soft Skill" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
