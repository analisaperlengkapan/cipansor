'use client';

import { useResearchProposals, useDeleteResearchProposal } from '@/hooks/use-research';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ProposalFormDialog } from './proposal-form-dialog';

export function ProposalList() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useResearchProposals({ page, limit: 10 });
  const { mutate: deleteProposal } = useDeleteResearchProposal();

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Research Proposals</h2>
        <ProposalFormDialog>
          <Button><Plus className="h-4 w-4 mr-2" /> New Proposal</Button>
        </ProposalFormDialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Researcher</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((proposal) => (
              <TableRow key={proposal.id}>
                <TableCell className="font-medium">
                  <Link href={`/research/proposals/${proposal.id}`} className="hover:underline">
                    {proposal.title}
                  </Link>
                </TableCell>
                <TableCell><Badge variant="outline">{proposal.category}</Badge></TableCell>
                <TableCell>{proposal.researcher?.name}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(proposal.budgetProposed))}
                </TableCell>
                <TableCell>
                  <Badge variant={
                    proposal.status === 'APPROVED' ? 'default' :
                    proposal.status === 'REJECTED' ? 'destructive' : 'secondary'
                  }>
                    {proposal.status}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(proposal.createdAt), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (confirm('Are you sure?')) deleteProposal(proposal.id);
                  }}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">No proposals found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
