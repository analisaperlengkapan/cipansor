'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');

  const { data: proposal, isLoading } = useQuery({
    queryKey: ['innovation-proposal', params.id],
    queryFn: async () => {
      const res = await axios.get(`/api/innovation/${params.id}`);
      return res.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/innovation/${params.id}/approve`);
    },
    onSuccess: () => {
      toast.success('Proposal approved and project created');
      queryClient.invalidateQueries({ queryKey: ['innovation-proposal', params.id] });
    },
    onError: () => toast.error('Failed to approve proposal'),
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/innovation/${params.id}/reject`);
    },
    onSuccess: () => {
      toast.success('Proposal rejected');
      queryClient.invalidateQueries({ queryKey: ['innovation-proposal', params.id] });
    },
    onError: () => toast.error('Failed to reject proposal'),
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/innovation/${params.id}/comments`, { content: comment });
    },
    onSuccess: () => {
      setComment('');
      toast.success('Comment added');
      queryClient.invalidateQueries({ queryKey: ['innovation-proposal', params.id] });
    },
    onError: () => toast.error('Failed to add comment'),
  });

  if (isLoading) return <div className="p-10 text-center">Loading...</div>;
  if (!proposal) return <div className="p-10 text-center">Proposal not found</div>;

  return (
    <div className="container py-8 max-w-4xl space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{proposal.title}</h1>
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            <Badge variant="outline">{proposal.type}</Badge>
            <span>•</span>
            <span>Submitted by {proposal.submittedBy?.name}</span>
            <span>•</span>
            <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
            <StatusBadge status={proposal.status} />
            {proposal.project && (
                <Button variant="link" onClick={() => router.push(`/project/${proposal.project.id}`)}>
                    View Project
                </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{proposal.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {proposal.comments?.map((comment: any) => (
                <div key={comment.id} className="flex gap-4">
                  <Avatar>
                    <AvatarImage src={comment.user?.photoUrl} />
                    <AvatarFallback>{comment.user?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-sm">{comment.user?.name}</span>
                        <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-4 pt-4">
                <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                />
                <Button onClick={() => commentMutation.mutate()} disabled={commentMutation.isPending || !comment.trim()}>
                    Post
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                {proposal.status !== 'APPROVED' && proposal.status !== 'REJECTED' && (
                    <>
                    <ReviewDialog proposalId={proposal.id} />
                    <Button
                        className="w-full"
                        variant="default"
                        onClick={() => approveMutation.mutate()}
                        disabled={approveMutation.isPending}
                    >
                        Approve & Create Project
                    </Button>
                    <Button
                        className="w-full"
                        variant="destructive"
                        onClick={() => rejectMutation.mutate()}
                        disabled={rejectMutation.isPending}
                    >
                        Reject
                    </Button>
                    </>
                )}
                {proposal.status === 'APPROVED' && (
                    <p className="text-center text-sm text-muted-foreground">This proposal has been approved.</p>
                )}
                {proposal.status === 'REJECTED' && (
                    <p className="text-center text-sm text-muted-foreground">This proposal has been rejected.</p>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {proposal.reviews?.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
                {proposal.reviews?.map((review: any) => (
                    <div key={review.id} className="border-b last:border-0 pb-2 last:pb-0">
                        <div className="flex justify-between">
                            <span className="font-medium text-sm">{review.reviewer?.name}</span>
                            <Badge>{review.score}/100</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{review.notes}</p>
                    </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ReviewDialog({ proposalId }: { proposalId: string }) {
    const [open, setOpen] = useState(false);
    const [score, setScore] = useState('');
    const [notes, setNotes] = useState('');
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            await axios.post(`/api/innovation/${proposalId}/reviews`, {
                score: parseInt(score),
                notes
            });
        },
        onSuccess: () => {
            toast.success('Review submitted');
            setOpen(false);
            setScore('');
            setNotes('');
            queryClient.invalidateQueries({ queryKey: ['innovation-proposal', proposalId] });
        },
        onError: () => toast.error('Failed to submit review')
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">Add Review</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Review</DialogTitle>
                    <DialogDescription>Submit your evaluation for this proposal.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Score (0-100)</Label>
                        <Input
                            type="number"
                            min="0"
                            max="100"
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Optional notes..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !score}>
                        Submit Review
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
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

    let className = "";
    if (status === 'APPROVED') className = "bg-green-100 text-green-800 hover:bg-green-100 border-green-200";

    return <Badge variant={variants[status] || 'outline'} className={className}>{status}</Badge>
}
