'use client';

import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { AssignmentForm } from '@/components/assignments/assignment-form';
import { useCreateAssignment } from '@/hooks/use-assignments';
import { useSubjects } from '@/hooks/use-curriculum';
import { useClasses } from '@/hooks/use-classes';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'sonner';

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const createMutation = useCreateAssignment();

  const { data: classesData } = useClasses({ unitId: user?.unitId });
  const { data: subjectsData } = useSubjects({ unitId: user?.unitId });

  const handleSubmit = async (data: any) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        unitId: user?.unitId,
        academicYearId: user?.academicYearId || 'default-id', // Should get active academic year
        teacherId: user?.teacher?.id,
      });
      toast.success('Assignment created');
      router.push('/assignments');
    } catch (error) {
      toast.error('Failed to create assignment');
    }
  };

  return (
    <MainLayout allowedRoles={['TEACHER', 'SUPER_ADMIN', 'UNIT_ADMIN']}>
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          title="Create Assignment"
          description="Create a new task for students"
          backUrl="/assignments"
        />

        <div className="p-6 bg-white rounded-lg border shadow-sm">
          <AssignmentForm
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending}
            classes={classesData?.data}
            subjects={subjectsData}
          />
        </div>
      </div>
    </MainLayout>
  );
}
