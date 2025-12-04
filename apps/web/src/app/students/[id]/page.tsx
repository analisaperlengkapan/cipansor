'use client';

import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { useStudent } from '@/hooks/use-students';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ArrowLeft, Pencil, User, Phone, Mail, MapPin, Calendar, GraduationCap } from 'lucide-react';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  GRADUATED: 'bg-blue-100 text-blue-800',
  DROPPED_OUT: 'bg-red-100 text-red-800',
};

const genderLabels: Record<string, string> = {
  MALE: 'Laki-laki',
  FEMALE: 'Perempuan',
};

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: student, isLoading } = useStudent(params.id as string);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    );
  }

  if (!student) {
    return (
      <MainLayout>
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Student not found</p>
          <Button variant="outline" onClick={() => router.push('/students')}>
            Back to Students
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout allowedRoles={['SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER']}>
      <div className="space-y-6">
        <PageHeader
          title={student.name}
          description={`NIS: ${student.nis}`}
        >
          <Button variant="outline" asChild>
            <Link href="/students">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/students/${student.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </PageHeader>

        {/* Status Banner */}
        <div className="flex items-center gap-4">
          <Badge className={statusColors[student.status]} variant="outline">
            {student.status}
          </Badge>
          {student.currentClass && (
            <Badge variant="secondary">
              <GraduationCap className="mr-1 h-3 w-3" />
              {student.currentClass.name}
            </Badge>
          )}
          <Badge variant="outline">{student.unit?.name}</Badge>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="tahfidz">Tahfidz</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoRow label="Full Name" value={student.name} />
                  <InfoRow label="Gender" value={genderLabels[student.gender]} />
                  <InfoRow
                    label="Birth Date"
                    value={format(new Date(student.birthDate), 'dd MMMM yyyy')}
                  />
                  <InfoRow label="Birth Place" value={student.birthPlace} />
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoRow
                    label="Phone"
                    value={student.phone || '-'}
                    icon={<Phone className="h-4 w-4" />}
                  />
                  <InfoRow
                    label="Email"
                    value={student.email || '-'}
                    icon={<Mail className="h-4 w-4" />}
                  />
                  <InfoRow
                    label="Address"
                    value={student.address}
                    icon={<MapPin className="h-4 w-4" />}
                  />
                </CardContent>
              </Card>

              {/* Parent Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Parent / Guardian</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoRow label="Name" value={student.parentName} />
                  <InfoRow label="Phone" value={student.parentPhone} />
                </CardContent>
              </Card>

              {/* Enrollment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Enrollment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoRow
                    label="Enrollment Date"
                    value={format(new Date(student.enrollmentDate), 'dd MMMM yyyy')}
                  />
                  <InfoRow label="Unit" value={student.unit?.name || '-'} />
                  <InfoRow
                    label="Current Class"
                    value={student.currentClass?.name || 'Not assigned'}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="academic">
            <Card>
              <CardHeader>
                <CardTitle>Academic History</CardTitle>
                <CardDescription>Student&apos;s academic records and grades</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Academic history will be displayed here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
                <CardDescription>Student&apos;s attendance history</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Attendance records will be displayed here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tahfidz">
            <Card>
              <CardHeader>
                <CardTitle>Tahfidz Progress</CardTitle>
                <CardDescription>Quran memorization progress</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Tahfidz progress will be displayed here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finance">
            <Card>
              <CardHeader>
                <CardTitle>Finance Summary</CardTitle>
                <CardDescription>Payment and invoice history</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Finance information will be displayed here...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

function InfoRow({ label, value, icon }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {value}
      </span>
    </div>
  );
}
