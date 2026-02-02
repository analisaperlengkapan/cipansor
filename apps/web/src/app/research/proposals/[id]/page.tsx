'use client';

import { useResearchProposal } from '@/hooks/use-research';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowLeft, Plus, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { OutputFormDialog } from '@/components/research/output-form-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ResearchProposalDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: proposal, isLoading } = useResearchProposal(id);

  if (isLoading || !proposal) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/research">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
            <h1 className="text-2xl font-bold">{proposal.title}</h1>
            <div className="flex items-center gap-2 mt-1">
                <Badge>{proposal.status}</Badge>
                <span className="text-muted-foreground text-sm">
                    {format(new Date(proposal.createdAt), 'PPP')}
                </span>
            </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium text-muted-foreground">Category</div>
              <div><Badge variant="outline">{proposal.category}</Badge></div>

              <div className="text-sm font-medium text-muted-foreground">Researcher</div>
              <div>{proposal.researcher?.name}</div>

              <div className="text-sm font-medium text-muted-foreground">Unit</div>
              <div>{proposal.unit?.name}</div>

              <div className="text-sm font-medium text-muted-foreground">Proposed Budget</div>
              <div className="font-semibold text-green-600">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(proposal.budgetProposed))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Abstract</CardTitle></CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{proposal.abstract || 'No abstract provided.'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Research Outputs</h2>
          <OutputFormDialog proposalId={proposal.id}>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Output</Button>
          </OutputFormDialog>
        </div>

        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Publication Date</TableHead>
                            <TableHead>Link</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {proposal.outputs?.map((output: any) => (
                            <TableRow key={output.id}>
                                <TableCell className="font-medium">{output.title}</TableCell>
                                <TableCell><Badge variant="outline">{output.type}</Badge></TableCell>
                                <TableCell>{output.publicationDate ? format(new Date(output.publicationDate), 'PPP') : '-'}</TableCell>
                                <TableCell>
                                    {output.url && (
                                        <a href={output.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                                            View <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {!proposal.outputs?.length && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No outputs recorded</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
