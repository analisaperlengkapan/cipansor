import { useTrainingPrograms, useDeleteTrainingProgram, TrainingProgram } from "@/hooks/use-talent";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus, Calendar } from "lucide-react";
import { useState } from "react";
import { TrainingDialog } from "./TrainingDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function TrainingList() {
  const { data, isLoading } = useTrainingPrograms();
  const deleteMutation = useDeleteTrainingProgram();
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteMutation.mutateAsync(deleteId);
        toast.success("Program deleted");
      } catch (error) {
        toast.error("Failed to delete program");
      }
      setDeleteId(null);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Training Programs</h2>
        <Button onClick={() => { setSelectedProgram(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Program
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Program Name</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((program) => (
              <TableRow key={program.id}>
                <TableCell className="font-medium">
                  {program.name}
                  <div className="text-xs text-muted-foreground">{program.location}</div>
                </TableCell>
                <TableCell>{program.provider || "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-3 w-3 text-muted-foreground" />
                    {format(new Date(program.startDate), "dd MMM yyyy")} - {format(new Date(program.endDate), "dd MMM yyyy")}
                  </div>
                </TableCell>
                <TableCell>{program._count?.participations || 0}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedProgram(program);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => setDeleteId(program.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No training programs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TrainingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        program={selectedProgram}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will delete the program and all participation records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
