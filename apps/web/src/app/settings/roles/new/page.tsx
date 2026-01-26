"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PermissionSelector } from "@/components/roles/permission-selector";
import { useCreateRole } from "@/hooks/use-roles";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const createRoleSchema = z.object({
  code: z.string().min(3).regex(/^[A-Z0-9_]+$/, "Code must be uppercase alphanumeric with underscores"),
  name: z.string().min(3, "Name is required"),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([]),
});

type CreateRoleForm = z.infer<typeof createRoleSchema>;

export default function CreateRolePage() {
  const router = useRouter();
  const createRoleMutation = useCreateRole();

  const form = useForm<CreateRoleForm>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      permissions: [],
    },
  });

  const onSubmit = async (data: CreateRoleForm) => {
    try {
      await createRoleMutation.mutateAsync(data);
      router.push("/settings/roles");
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <MainLayout allowedRoles={["SUPER_ADMIN"]}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader title="Create Role">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </PageHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Finance Staff" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Code (Unique)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. FINANCE_STAFF" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the role responsibilities..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="permissions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permissions</FormLabel>
                  <FormControl>
                    <PermissionSelector
                      selectedPermissions={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRoleMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {createRoleMutation.isPending ? "Creating..." : "Create Role"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </MainLayout>
  );
}
