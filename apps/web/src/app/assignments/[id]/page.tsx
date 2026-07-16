"use client";
import { useParams } from "next/navigation";
import { safeFormat } from "@/lib/date";
import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components/shared";
import {
  useAssignment,
  useAssignmentSubmissions,
  useSubmitAssignment,
  useGradeSubmission,
} from "@/hooks/use-assignments";
import { SubmissionList } from "@/components/assignments/submission-list";
import { SubmissionForm } from "@/components/assignments/submission-form";
import { useAuthStore } from "@/stores/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { toast } from "sonner";
import { getEffectiveRole } from "@/lib/rbac";

export default function AssignmentDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { data: assignment, isLoading } = useAssignment(id as string);

  const isTeacher =
    getEffectiveRole(user) === "TEACHER" ||
    getEffectiveRole(user) === "SUPER_ADMIN" ||
    getEffectiveRole(user) === "UNIT_ADMIN";
  const isStudent = getEffectiveRole(user) === "STUDENT";

  // Teacher hooks
  const { data: submissions, isLoading: isLoadingSubmissions } =
    useAssignmentSubmissions(id as string);
  const gradeMutation = useGradeSubmission();

  // Student hooks
  const submitMutation = useSubmitAssignment();

  // Find student's submission
  const studentSubmission =
    isStudent && submissions
      ? submissions.find((s) => s.studentId === user?.student?.id)
      : null;

  const handleGrade = async (
    studentId: string,
    grade: number,
    feedback?: string,
  ) => {
    try {
      await gradeMutation.mutateAsync({
        assignmentId: id as string,
        studentId,
        data: { grade, feedback },
      });
      toast.success("Graded successfully");
    } catch {
      toast.error("Failed to grade");
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (!user?.student?.id) {
        toast.error("Student ID not found");
        return;
      }
      await submitMutation.mutateAsync({
        id: id as string,
        data: {
          studentId: user.student.id,
          content: data.content,
        },
      });
      toast.success("Submitted successfully");
    } catch {
      toast.error("Failed to submit");
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!assignment) return <div>Assignment not found</div>;

  return (
    <MainLayout
      allowedRoles={["TEACHER", "STUDENT", "SUPER_ADMIN", "UNIT_ADMIN"]}
    >
      <div className="space-y-6">
        <PageHeader
          title={assignment.title}
          description="Assignment Details"
          backHref="/assignments"
        />

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{assignment.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Subject: {assignment.subject?.name} | Class:{" "}
                  {assignment.class?.name}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="outline">{assignment.type}</Badge>
                <span className="text-sm text-red-600">
                  Due:{" "}
                  {safeFormat(
                    new Date(assignment.dueDate),
                    "dd MMM yyyy HH:mm",
                  )}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{assignment.description}</p>
          </CardContent>
        </Card>

        {isTeacher && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Student Submissions</h3>
            <SubmissionList
              submissions={submissions || []}
              isLoading={isLoadingSubmissions}
              onGrade={handleGrade}
            />
          </div>
        )}

        {isStudent && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Submission</h3>
            <Card>
              <CardContent className="pt-6">
                <SubmissionForm
                  initialData={studentSubmission}
                  onSubmit={handleSubmit}
                  isLoading={submitMutation.isPending}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
