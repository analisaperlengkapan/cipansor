import { ProposalList } from '@/components/research/proposal-list';

export default function ResearchPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Research & Development</h1>
      <p className="text-muted-foreground">Manage research proposals, grants, and publications.</p>
      <ProposalList />
    </div>
  );
}
