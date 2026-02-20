"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PermissionSelector } from "@/components/roles/permission-selector";
import { useRole, useUpdateRole } from "@/hooks/use-roles";
import { ArrowLeft, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const updateRoleSchema = z.object({
  name: z.string().min(3, "Name is required"),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

type UpdateRoleForm = z.infer<typeof updateRoleSchema>;

export default function EditRolePage() {
  const params = useParams();
  const router = useRouter();
  const roleId = params.id as string;

  const { data: role, isLoading } = useRole(roleId);
  const updateRoleMutation = useUpdateRole(roleId);

  const form = useForm<UpdateRoleForm>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  });

  // Load data into form
  useEffect(() => {
    if (role) {
      form.reset({
        name: role.name,
        description: role.description || "",
        permissions: (role.permissions as string[]) || [],
      });
    }
  }, [role, form]);

  const onSubmit = async (data: UpdateRoleForm) => {
    try {
      await updateRoleMutation.mutateAsync(data);
      router.push("/settings/roles");
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <MainLayout allowedRoles={["SUPER_ADMIN"]}>
        <div className="space-y-6 max-w-4xl mx-auto">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!role) {
    return (
      <MainLayout allowedRoles={["SUPER_ADMIN"]}>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <h2 className="text-xl font-semibold">Role not found</h2>
          <Button variant="link" onClick={() => router.push("/settings/roles")}>
            Back to Roles
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout allowedRoles={["SUPER_ADMIN"]}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader title={`Edit Role: ${role.name}`}>
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
              <FormItem>
                <FormLabel>Role Code</FormLabel>
                <FormControl>
                  <Input value={role.code} disabled className="bg-muted" />
                </FormControl>
                <p className="text-[0.8rem] text-muted-foreground">
                  Code cannot be changed.
                </p>
              </FormItem>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the role responsibilities..."
                        {...field}
                      />
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
                      selectedPermissions={field.value || []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateRoleMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateRoleMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </MainLayout>
  );
}
