'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { useUser, useUpdateUser } from '@/hooks/use-users';
import { useUnits } from '@/hooks/use-units';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER', 'STUDENT', 'STAFF', 'PARENT']),
  unitId: z.string().optional(),
  isActive: z.boolean(),
});

type UserForm = z.infer<typeof userSchema>;

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  UNIT_ADMIN: 'Unit Admin',
  TEACHER: 'Teacher',
  STAFF: 'Staff',
  STUDENT: 'Student',
  PARENT: 'Parent',
};

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { data: user, isLoading } = useUser(params.id as string);
  const { data: units } = useUnits();
  const updateMutation = useUpdateUser();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        name: user.name,
        role: user.role,
        unitId: user.unitId || '',
        isActive: user.isActive,
      });
    }
  }, [user, reset]);

  const selectedRole = watch('role');
  const needsUnit = selectedRole && selectedRole !== 'SUPER_ADMIN';

  const onSubmit = async (data: UserForm) => {
    try {
      await updateMutation.mutateAsync({
        id: params.id as string,
        data: {
          ...data,
          unitId: needsUnit ? data.unitId : undefined,
        },
      });
      toast.success('User updated successfully');
      router.push(`/users/${params.id}`);
    } catch {
      toast.error('Failed to update user');
    }
  };

  const availableRoles = currentUser?.role === 'SUPER_ADMIN'
    ? ['SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER', 'STAFF', 'STUDENT', 'PARENT']
    : ['UNIT_ADMIN', 'TEACHER', 'STAFF', 'STUDENT', 'PARENT'];

  const isSelf = user?.id === currentUser?.id;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">User not found</p>
          <Button variant="outline" onClick={() => router.push('/users')}>
            Back to Users
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout allowedRoles={['SUPER_ADMIN', 'UNIT_ADMIN']}>
      <div className="space-y-6">
        <PageHeader
          title="Edit User"
          description={`Editing: ${user.name}`}
        >
          <Button variant="outline" asChild>
            <Link href={`/users/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </PageHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>User profile details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" {...register('name')} />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Role & Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Role & Assignment</CardTitle>
              <CardDescription>User role and unit assignment</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={watch('role')}
                  onValueChange={(value) => setValue('role', value as UserForm['role'])}
                  disabled={isSelf}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isSelf && (
                  <p className="text-xs text-muted-foreground">You cannot change your own role</p>
                )}
              </div>

              {needsUnit && (
                <div className="space-y-2">
                  <Label>Unit *</Label>
                  <Select
                    value={watch('unitId')}
                    onValueChange={(value) => setValue('unitId', value)}
                    disabled={currentUser?.role !== 'SUPER_ADMIN'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units?.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>Enable or disable user access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow this user to access the system
                  </p>
                </div>
                <Switch
                  checked={watch('isActive')}
                  onCheckedChange={(checked) => setValue('isActive', checked)}
                  disabled={isSelf}
                />
              </div>
              {isSelf && (
                <p className="mt-2 text-xs text-muted-foreground">
                  You cannot deactivate your own account
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
