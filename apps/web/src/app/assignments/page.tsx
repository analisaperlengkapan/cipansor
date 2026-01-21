'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { useAssignments } from '@/hooks/use-assignments';
import { useAuthStore } from '@/stores/auth';
import { AssignmentList } from '@/components/assignments/assignment-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AssignmentsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter based on role
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';

  // For teacher: show assignments they created
  // For student: show assignments for their class (filtered by backend usually, or we pass studentId)
  const queryParams = {
    page,
    limit: pageSize,
    teacherId: isTeacher ? user?.teacher?.id : undefined,
    studentId: isStudent ? user?.student?.id : undefined,
  };

  const { data, isLoading } = useAssignments(queryParams);

  return (
    <MainLayout allowedRoles={['TEACHER', 'STUDENT', 'SUPER_ADMIN', 'UNIT_ADMIN']}>
      <div className="space-y-6">
        <PageHeader
          title="Assignments"
          description="Manage tasks and homework"
          action={
            isTeacher || user?.role === 'SUPER_ADMIN'
              ? { label: 'Create Assignment', href: '/assignments/create' }
              : undefined
          }
        />

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Assignments</TabsTrigger>
            {/* Add more tabs like "Active", "Past" later */}
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <AssignmentList
              assignments={data?.data || []}
              isLoading={isLoading}
              pagination={data?.meta || {}}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
