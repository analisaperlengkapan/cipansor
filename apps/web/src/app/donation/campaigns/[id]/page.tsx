"use client";

import { use } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Heart,
  Pencil,
  Calendar,
  Target,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCampaign,
  useDonations,
  useVerifyDonation,
  CAMPAIGN_STATUSES,
  DONATION_STATUSES,
  DONATION_TYPES,
  formatCurrency,
  calculateProgress,
  DonationStatus,
} from "@/hooks/use-donation";

interface Props {
  params: Promise<{ id: string }>;
}

export default function CampaignDetailPage({ params }: Props) {
  const { id } = use(params);
  const { data: campaign, isLoading } = useCampaign(id);
  const { data: donationsData, isLoading: donationsLoading } = useDonations({
    campaignId: id,
    limit: 50,
  });
  const verifyDonation = useVerifyDonation();

  const donations = donationsData?.data || [];
  const progress = campaign
    ? calculateProgress(campaign.collectedAmount, campaign.targetAmount)
    : 0;

  const handleVerifyDonation = async (
    donationId: string,
    status: DonationStatus,
  ) => {
    try {
      await verifyDonation.mutateAsync({ id: donationId, status });
      toast.success(
        status === "VERIFIED" ? "Donasi terverifikasi" : "Donasi dibatalkan",
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal memverifikasi donasi";
      toast.error(errorMessage);
    }
  };

  const getCampaignStatusBadge = (status: string) => {
    const config = CAMPAIGN_STATUSES.find((s) => s.value === status);
    return (
      <Badge variant="secondary" className={config?.color}>
        {config?.label || status}
      </Badge>
    );
  };

  const getDonationStatusBadge = (status: DonationStatus) => {
    const config = DONATION_STATUSES.find((s) => s.value === status);
    return (
      <Badge variant="secondary" className={config?.color}>
        {config?.label || status}
      </Badge>
    );
  };

  const getDonationTypeLabel = (type: string) => {
    return DONATION_TYPES.find((t) => t.value === type)?.label || type;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!campaign) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Campaign tidak ditemukan</p>
          <Button asChild className="mt-4">
            <Link href="/donation">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Calculate stats
  const verifiedDonations = donations.filter((d) => d.status === "VERIFIED");
  const pendingDonations = donations.filter((d) => d.status === "PENDING");
  const verifiedAmount = verifiedDonations.reduce(
    (sum, d) => sum + d.amount,
    0,
  );

  return (
    <MainLayout>
      <PageHeader
        title={campaign.title}
        description={`Campaign donasi ${campaign.unit?.name || "Yayasan"}`}
        backHref="/donation"
        backLabel="Kembali"
        action={
          <Button asChild>
            <Link href={`/donation/campaigns/${id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Banner */}
          {campaign.imageUrl && (
            <Card className="overflow-hidden">
              <img
                src={campaign.imageUrl}
                alt={campaign.title}
                className="w-full h-64 object-cover"
              />
            </Card>
          )}

          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Progress Penggalangan Dana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Terkumpul</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-4" />
                <div className="flex justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(campaign.collectedAmount)}
                    </p>
                    <p className="text-sm text-muted-foreground">Terkumpul</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-medium text-muted-foreground">
                      {formatCurrency(campaign.targetAmount)}
                    </p>
                    <p className="text-sm text-muted-foreground">Target</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Deskripsi Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">
                {campaign.description || "Tidak ada deskripsi"}
              </p>
            </CardContent>
          </Card>

          {/* Donations List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Daftar Donatur
                </span>
                <Badge variant="secondary">{donations.length} donasi</Badge>
              </CardTitle>
              <CardDescription>
                Riwayat donasi yang masuk untuk campaign ini
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Donatur</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donationsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : donations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          Belum ada donasi
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    donations.map((donation) => (
                      <TableRow key={donation.id}>
                        <TableCell>
                          {format(new Date(donation.createdAt), "d MMM yyyy", {
                            locale: localeId,
                          })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {donation.isAnonymous
                                ? "Hamba Allah"
                                : donation.donorName}
                            </p>
                            {!donation.isAnonymous && donation.donorPhone && (
                              <p className="text-sm text-muted-foreground">
                                {donation.donorPhone}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getDonationTypeLabel(donation.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(donation.amount)}
                        </TableCell>
                        <TableCell>
                          {getDonationStatusBadge(donation.status)}
                        </TableCell>
                        <TableCell>
                          {donation.status === "PENDING" && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleVerifyDonation(donation.id, "VERIFIED")
                                }
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleVerifyDonation(donation.id, "CANCELLED")
                                }
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi Campaign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                {getCampaignStatusBadge(campaign.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Unit</span>
                <span className="font-medium">
                  {campaign.unit?.name || "Yayasan"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Date Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Periode Campaign
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Tanggal Mulai</p>
                <p className="font-medium">
                  {campaign.startDate
                    ? format(new Date(campaign.startDate), "d MMMM yyyy", {
                        locale: localeId,
                      })
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Tanggal Berakhir
                </p>
                <p className="font-medium">
                  {campaign.endDate
                    ? format(new Date(campaign.endDate), "d MMMM yyyy", {
                        locale: localeId,
                      })
                    : "Tanpa batas waktu"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statistik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-muted-foreground">Total Donatur</span>
                </div>
                <span className="font-bold">{campaign.donorCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Terverifikasi</span>
                </div>
                <span className="font-bold text-green-600">
                  {verifiedDonations.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-muted-foreground">Pending</span>
                </div>
                <span className="font-bold text-yellow-600">
                  {pendingDonations.length}
                </span>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">
                      Dana Terverifikasi
                    </span>
                  </div>
                </div>
                <p className="text-xl font-bold text-green-600 mt-1">
                  {formatCurrency(verifiedAmount)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/donation/new?campaignId=${id}`}>
                  <Heart className="h-4 w-4 mr-2" />
                  Catat Donasi Baru
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/donation/campaigns/${id}/edit`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Campaign
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
