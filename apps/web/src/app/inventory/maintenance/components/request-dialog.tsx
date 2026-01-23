"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useCreateMaintenanceRequest } from "@/hooks/use-inventory";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInventoryItems, AssetStatus } from "@/hooks/use-inventory";

const formSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  type: z.string().min(1, "Type is required"),
  description: z.string().min(1, "Description is required"),
  notes: z.string().optional(),
});

export function MaintenanceRequestDialog() {
  const [open, setOpen] = useState(false);
  const { mutateAsync: createRequest, isPending } =
    useCreateMaintenanceRequest();
  const { data: assets } = useInventoryItems({
    limit: 100,
    status: AssetStatus.ACTIVE,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assetId: "",
      type: "",
      description: "",
      notes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createRequest(values);
      toast.success("Maintenance request submitted successfully");
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error("Failed to submit request");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Maintenance</DialogTitle>
          <DialogDescription>Report an issue with an asset.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="assetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assets?.data.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.code} - {asset.name}
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Repair">Repair</SelectItem>
                      <SelectItem value="Broken">Broken</SelectItem>
                      <SelectItem value="Malfunction">Malfunction</SelectItem>
                      <SelectItem value="Maintenance">
                        Routine Maintenance
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                    <Textarea placeholder="Describe the issue..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Additional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
