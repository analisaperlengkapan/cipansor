import Link from 'next/link';
import { format } from 'date-fns';
import { Plus, BookOpen } from 'lucide-react';
import {
  useStudentCounselingHistory,
  getCounselingCategoryConfig,
  getCounselingStatusConfig
} from '@/hooks/use-counseling';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StudentCounselingTabProps {
  studentId: string;
}

export function StudentCounselingTab({ studentId }: StudentCounselingTabProps) {
  const { data: counselingHistory, isLoading } = useStudentCounselingHistory(studentId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Counseling History</CardTitle>
          <CardDescription>Record of counseling sessions and guidance</CardDescription>
        </div>
        <Button size="sm" asChild>
          <Link href={`/counseling/new?studentId=${studentId}`}>
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-4">
            {counselingHistory?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {counselingHistory.map((record) => {
                    const catConfig = getCounselingCategoryConfig(record.category);
                    const statusConfig = getCounselingStatusConfig(record.status);
                    return (
                      <TableRow key={record.id}>
                        <TableCell>{format(new Date(record.reportedAt), 'dd MMM yyyy')}</TableCell>
                        <TableCell>
                          <Badge className={catConfig?.color} variant="outline">
                            {catConfig?.icon} {catConfig?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{record.title}</TableCell>
                        <TableCell>
                          <Badge className={statusConfig?.color}>{statusConfig?.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/counseling/${record.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No counseling records found.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
