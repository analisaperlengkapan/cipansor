'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';

export default function InnovationPage() {
  const { data: proposals, isLoading } = useQuery({
    queryKey: ['innovation-proposals'],
    queryFn: async () => {
      const res = await axios.get('/api/innovation');
      return res.data;
    },
  });

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Innovation Center</h1>
          <p className="text-muted-foreground">Manage and review innovation proposals.</p>
        </div>
        <Link href="/innovation/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Submit Idea
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Ideas</TabsTrigger>
          <TabsTrigger value="mine" disabled>My Ideas (Coming Soon)</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
            {isLoading ? <div>Loading...</div> : <ProposalGrid proposals={proposals} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProposalGrid({ proposals }: { proposals: any[] }) {
    if (!proposals?.length) return <div className="text-center py-10 text-muted-foreground">No proposals found.</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposals.map((proposal) => (
                <Link href={`/innovation/${proposal.id}`} key={proposal.id}>
                    <Card className="h-full hover:shadow-md transition-all cursor-pointer">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg line-clamp-1">{proposal.title}</CardTitle>
                                <StatusBadge status={proposal.status} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-muted-foreground mb-2 font-semibold text-primary">{proposal.type}</div>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                                {proposal.description}
                            </p>
                            <div className="mt-4 pt-4 border-t text-xs text-muted-foreground flex justify-between">
                                <span>by {proposal.submittedBy?.name}</span>
                                <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        DRAFT: 'secondary',
        SUBMITTED: 'default',
        REVIEW: 'outline',
        APPROVED: 'default',
        REJECTED: 'destructive'
    };

    // Custom styling
    let className = "";
    if (status === 'APPROVED') className = "bg-green-100 text-green-800 hover:bg-green-100 border-green-200";
    if (status === 'SUBMITTED') className = "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200";

    return <Badge variant={variants[status] || 'outline'} className={className}>{status}</Badge>
}
