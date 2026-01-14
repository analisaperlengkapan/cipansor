'use client';

import { useState } from 'react';
import { useCampaigns } from '@/hooks/use-marketing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Copy, Loader2 } from 'lucide-react';
import { CampaignFormDialog } from '@/components/marketing/campaign-form-dialog';
import { MarketingCampaign } from '@cipansor/shared';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function CampaignsPage() {
  const { data: campaigns, isLoading } = useCampaigns();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<MarketingCampaign | null>(null);

  const handleCreate = () => {
    setSelectedCampaign(null);
    setDialogOpen(true);
  };

  const handleEdit = (campaign: MarketingCampaign) => {
    setSelectedCampaign(campaign);
    setDialogOpen(true);
  };

  const copyTrackingLink = (id: string) => {
      const url = `${window.location.origin}/public/ppdb?campaign_id=${id}`;
      navigator.clipboard.writeText(url);
      toast.success('Link tersalin ke clipboard');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manajemen Kampanye</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Kampanye Baru
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kampanye</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Pendaftar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : campaigns?.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{campaign.code}</span>
                  </TableCell>
                  <TableCell>{campaign.budget ? formatCurrency(Number(campaign.budget)) : '-'}</TableCell>
                  <TableCell>
                    {new Date(campaign.startDate).toLocaleDateString()} - {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Seterusnya'}
                  </TableCell>
                  <TableCell>{campaign._count?.registrants || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Button variant="ghost" size="icon" onClick={() => copyTrackingLink(campaign.id)} title="Salin Link Tracking">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(campaign)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (!campaigns || campaigns.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Belum ada kampanye aktif
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CampaignFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campaign={selectedCampaign}
      />
    </div>
  );
}
