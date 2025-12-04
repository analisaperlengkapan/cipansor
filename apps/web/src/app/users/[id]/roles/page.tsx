'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { useUser } from '@/hooks/use-users';
import { useUserRoles, useRoles, useAssignRole, useRemoveRoleAssignment, useSetPrimaryRole, realmDisplayNames, realmColors, groupRolesByRealm } from '@/hooks/use-roles';
import { useUnits } from '@/hooks/use-units';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Plus, Trash2, Star, Building2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { RoleAssignment, Role } from '@/lib/api';

export default function UserRolesPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [deleteAssignment, setDeleteAssignment] = useState<RoleAssignment | null>(null);
  
  const { data: user, isLoading: userLoading } = useUser(userId);
  const { data: userRoles, isLoading: rolesLoading } = useUserRoles(userId);
  const { data: allRoles } = useRoles();
  const { data: units } = useUnits();
  
  const assignRoleMutation = useAssignRole();
  const removeRoleMutation = useRemoveRoleAssignment();
  const setPrimaryMutation = useSetPrimaryRole();
  
  // Group available roles by realm
  const rolesByRealm = useMemo(() => {
    if (!allRoles) return {};
    return groupRolesByRealm(allRoles);
  }, [allRoles]);
  
  // Filter out roles already assigned
  const availableRoles = useMemo(() => {
    if (!allRoles || !userRoles) return allRoles || [];
    const assignedRoleIds = new Set(userRoles.map(ur => ur.roleId));
    return allRoles.filter(role => !assignedRoleIds.has(role.id));
  }, [allRoles, userRoles]);
  
  const availableRolesByRealm = useMemo(() => {
    return groupRolesByRealm(availableRoles);
  }, [availableRoles]);
  
  // Get selected role details
  const selectedRole = useMemo(() => {
    return allRoles?.find(r => r.id === selectedRoleId);
  }, [allRoles, selectedRoleId]);
  
  const handleAssignRole = async () => {
    if (!selectedRoleId) {
      toast.error('Please select a role');
      return;
    }
    
    try {
      await assignRoleMutation.mutateAsync({
        userId,
        roleId: selectedRoleId,
        unitId: selectedUnitId || undefined,
        isPrimary: (userRoles?.length || 0) === 0,
      });
      setIsAddDialogOpen(false);
      setSelectedRoleId('');
      setSelectedUnitId('');
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  const handleRemoveRole = async () => {
    if (!deleteAssignment) return;
    
    try {
      await removeRoleMutation.mutateAsync(deleteAssignment.id);
      setDeleteAssignment(null);
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  const handleSetPrimary = async (assignmentId: string) => {
    try {
      await setPrimaryMutation.mutateAsync({ userId, roleAssignmentId: assignmentId });
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  if (userLoading) {
    return (
      <MainLayout allowedRoles={['SUPER_ADMIN', 'UNIT_ADMIN']}>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </MainLayout>
    );
  }
  
  if (!user) {
    return (
      <MainLayout allowedRoles={['SUPER_ADMIN', 'UNIT_ADMIN']}>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <h2 className="text-xl font-semibold">User not found</h2>
          <Button variant="link" onClick={() => router.push('/users')}>
            Back to Users
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout allowedRoles={['SUPER_ADMIN', 'UNIT_ADMIN']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/users')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Manage Roles</h1>
            <p className="text-muted-foreground">
              {user.name} ({user.email})
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Assign Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Assign Role</DialogTitle>
                <DialogDescription>
                  Add a new role to {user.name}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {Object.entries(availableRolesByRealm).map(([realm, roles]) => (
                        <SelectGroup key={realm}>
                          <SelectLabel className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className={cn('text-white text-xs', realmColors[realm]?.split(' ')[0])}
                            >
                              {realmDisplayNames[realm] || realm}
                            </Badge>
                          </SelectLabel>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedRole && !['GLOBAL', 'YAYASAN'].includes(selectedRole.realm) && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unit (optional)</label>
                    <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No specific unit</SelectItem>
                        {units?.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Assign to a specific unit or leave empty for realm-wide access
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssignRole} 
                  disabled={!selectedRoleId || assignRoleMutation.isPending}
                >
                  {assignRoleMutation.isPending ? 'Assigning...' : 'Assign Role'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Current Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Assigned Roles
            </CardTitle>
            <CardDescription>
              {userRoles?.length || 0} role(s) assigned to this user
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rolesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : !userRoles || userRoles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No roles assigned yet. Click "Assign Role" to add one.
              </div>
            ) : (
              <div className="space-y-3">
                {userRoles.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-lg border',
                      assignment.isPrimary && 'border-primary bg-primary/5'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <Badge 
                        variant="secondary"
                        className={cn('text-white', realmColors[assignment.role.realm]?.split(' ')[0])}
                      >
                        {realmDisplayNames[assignment.role.realm] || assignment.role.realm}
                      </Badge>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{assignment.role.name}</span>
                          {assignment.isPrimary && (
                            <Badge variant="outline" className="text-xs">
                              <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                              Primary
                            </Badge>
                          )}
                        </div>
                        {assignment.unit && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Building2 className="h-3 w-3" />
                            {assignment.unit.name}
                          </div>
                        )}
                        {assignment.role.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {assignment.role.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!assignment.isPrimary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPrimary(assignment.id)}
                          disabled={setPrimaryMutation.isPending}
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Set Primary
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteAssignment(assignment)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteAssignment} onOpenChange={() => setDeleteAssignment(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Role</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove the role "{deleteAssignment?.role.name}" from this user?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveRole}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {removeRoleMutation.isPending ? 'Removing...' : 'Remove Role'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
