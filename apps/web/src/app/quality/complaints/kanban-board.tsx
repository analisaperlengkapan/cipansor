import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Complaint } from "@/hooks/use-complaints";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Link from "next/link";

interface KanbanBoardProps {
  complaints: Complaint[];
}

const COLUMNS = [
  { id: "PENDING", title: "Menunggu", color: "bg-gray-100 dark:bg-gray-900/50" },
  { id: "IN_PROGRESS", title: "Diproses", color: "bg-blue-50 dark:bg-blue-900/20" },
  { id: "RESOLVED", title: "Selesai", color: "bg-green-50 dark:bg-green-900/20" },
  { id: "REJECTED", title: "Ditolak", color: "bg-red-50 dark:bg-red-900/20" },
];

export function KanbanBoard({ complaints }: KanbanBoardProps) {
  const getColumnComplaints = (status: string) =>
    complaints.filter((c) => c.status === status);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <Badge variant="destructive" className="text-[10px] px-1 h-5">Urgent</Badge>;
      case "HIGH":
        return <Badge className="bg-orange-500 text-[10px] px-1 h-5">Tinggi</Badge>;
      case "LOW":
        return <Badge variant="secondary" className="text-[10px] px-1 h-5">Rendah</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1 h-5">Normal</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const columnComplaints = getColumnComplaints(col.id);
        return (
          <div
            key={col.id}
            className={`flex flex-col rounded-lg p-2 ${col.color} border border-border/50`}
          >
            <div className="font-semibold text-sm mb-3 px-2 flex justify-between items-center">
              {col.title}
              <Badge variant="secondary" className="bg-background text-foreground text-xs">
                {columnComplaints.length}
              </Badge>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-250px)] scrollbar-hide">
              {columnComplaints.map((complaint) => (
                <Link
                  key={complaint.id}
                  href={`/quality/complaints/${complaint.id}`}
                  className="block"
                >
                  <Card className="hover:shadow-md transition-all cursor-pointer border-l-4" style={{ borderLeftColor: getBorderColor(complaint.priority) }}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="font-medium text-sm line-clamp-2 leading-tight">
                          {complaint.subject}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getPriorityBadge(complaint.priority)}
                        <Badge variant="secondary" className="text-[10px] px-1 h-5 bg-muted">
                          {complaint.category}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t mt-2">
                        <span className="truncate max-w-[100px]">
                          {complaint.isAnonymous ? "Anonim" : complaint.user?.name || "-"}
                        </span>
                        <span>
                          {format(new Date(complaint.createdAt), "dd MMM", {
                            locale: idLocale,
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {columnComplaints.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-8 border-2 border-dashed border-muted-foreground/20 rounded-md">
                  Kosong
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getBorderColor(priority: string) {
  switch (priority) {
    case "URGENT": return "#ef4444"; // red-500
    case "HIGH": return "#f97316"; // orange-500
    case "LOW": return "#64748b"; // slate-500
    default: return "#3b82f6"; // blue-500
  }
}
