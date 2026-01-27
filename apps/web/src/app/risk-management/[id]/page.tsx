"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskLevelBadge, RiskStatusBadge } from "@/components/risk/risk-badges";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from "react";
import { toast } from "sonner";
import { Trash, CheckCircle, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const MitigationStrategy = ["AVOID", "REDUCE", "SHARE", "ACCEPT"] as const;

const mitigationSchema = z.object({
  strategy: z.enum(MitigationStrategy),
  actionPlan: z.string().min(5),
  deadline: z.string().optional(),
  notes: z.string().optional(),
});

export default function RiskDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const { data: risk, isLoading } = useQuery({
    queryKey: ["risk", id],
    queryFn: async () => {
      try {
        const res = await api.get(`/risk/${id}`);
        return res.data.data;
      } catch (e) {
        return null;
      }
    },
    enabled: !!id,
  });

  const form = useForm<z.infer<typeof mitigationSchema>>({
    resolver: zodResolver(mitigationSchema),
    defaultValues: {
      strategy: "REDUCE",
      actionPlan: "",
      deadline: "",
      notes: "",
    }
  });

  const addMitigation = useMutation({
    mutationFn: (data: z.infer<typeof mitigationSchema>) => api.post("/risk/mitigation", { ...data, riskId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk", id] });
      setOpen(false);
      form.reset();
      toast.success("Mitigation added");
    },
    onError: () => toast.error("Failed to add mitigation")
  });

  const deleteMitigation = useMutation({
    mutationFn: (mitigationId: string) => api.delete(`/risk/mitigation/${mitigationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk", id] });
      toast.success("Mitigation deleted");
    }
  });

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!risk) return <div className="p-8">Risk not found</div>;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title={`Risk Details: ${risk.code}`}
        description="View and manage risk details and mitigation plans."
        backUrl="/risk-management"
        actions={
          <Button variant="destructive" size="sm" onClick={async () => {
            if(confirm("Delete this risk?")) {
              await api.delete(`/risk/${id}`);
              router.push("/risk-management");
            }
          }}>Delete Risk</Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Category</div>
                  <div className="font-medium">{risk.category}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <RiskStatusBadge status={risk.status} />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Level</div>
                  <RiskLevelBadge level={risk.riskLevel} />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Score</div>
                  <div className="font-medium">{risk.riskScore} (L:{risk.likelihood} x I:{risk.impact})</div>
                </div>
              </div>
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground mb-1">Description</div>
                <p className="text-sm">{risk.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Cause</div>
                  <p className="text-sm text-slate-600">{risk.cause || "-"}</p>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Consequence</div>
                  <p className="text-sm text-slate-600">{risk.consequence || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Mitigation Plans</CardTitle>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">Add Plan</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Mitigation Plan</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => addMitigation.mutate(data))} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="strategy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Strategy</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                {MitigationStrategy.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="actionPlan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Action Plan</FormLabel>
                            <FormControl><Textarea {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deadline (YYYY-MM-DD)</FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={addMitigation.isPending}>Save</Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {risk.mitigations && risk.mitigations.length > 0 ? (
                <div className="space-y-4">
                  {risk.mitigations.map((m: any) => (
                    <div key={m.id} className="border p-4 rounded-lg flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{m.strategy}</Badge>
                          {m.isCompleted ? (
                            <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1"/> Completed</Badge>
                          ) : (
                            <Badge variant="secondary"><Clock className="w-3 h-3 mr-1"/> In Progress {m.progress}%</Badge>
                          )}
                        </div>
                        <p className="font-medium text-sm mt-2">{m.actionPlan}</p>
                        {m.deadline && (
                          <div className="text-xs text-muted-foreground mt-1">Deadline: {new Date(m.deadline).toLocaleDateString()}</div>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteMitigation.mutate(m.id)}>
                        <Trash className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">No mitigation plans yet.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
           <Card>
             <CardHeader><CardTitle>Meta</CardTitle></CardHeader>
             <CardContent className="text-sm space-y-2">
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Created By</span>
                 <span>{risk.createdBy?.name || "Unknown"}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Date</span>
                 <span>{new Date(risk.createdAt).toLocaleDateString()}</span>
               </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
