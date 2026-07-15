"use client";
import { useState } from "react";
import { safeFormat } from "@/lib/date";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  usePublicCampaigns,
  useCampaign,
  useCreatePublicDonation,
  DONATION_TYPES,
  PAYMENT_METHODS,
  DonationType,
  PaymentMethod,
  DonationCampaign,
  formatCurrency,
  calculateProgress,
} from "@/hooks/use-donation";
import {
  Heart,
  HandHeart,
  Target,
  Users,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Banknote,
  CreditCard,
  QrCode,
  Wallet,
  Gift,
  Building2,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { id as idLocale } from "date-fns/locale";
import Link from "next/link";

const paymentIcons: Record<
  PaymentMethod,
  React.ComponentType<{ className?: string }>
> = {
  CASH: Banknote,
  BANK_TRANSFER: Building2,
  QRIS: QrCode,
  EWALLET: Wallet,
  OTHERS: CreditCard,
};

export default function PublicDonationPage() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{
    donorName: string;
    amount: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    donorName: "",
    donorPhone: "",
    donorEmail: "",
    donorAddress: "",
    isAnonymous: false,
    type: "INFAK" as DonationType,
    amount: "",
    paymentMethod: "BANK_TRANSFER" as PaymentMethod,
    notes: "",
  });

  const { data: campaignsData, isLoading } = usePublicCampaigns();
  const campaigns = campaignsData?.data || [];
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");

  const createDonation = useCreatePublicDonation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.donorName.trim() && !formData.isAnonymous) {
      toast.error("Nama donatur harus diisi atau pilih donasi anonim");
      return;
    }

    if (!formData.amount || parseInt(formData.amount) < 10000) {
      toast.error("Minimal donasi Rp 10.000");
      return;
    }

    setIsSubmitting(true);
    try {
      await createDonation.mutateAsync({
        campaignId: selectedCampaignId || undefined,
        donorName: formData.isAnonymous ? "Hamba Allah" : formData.donorName,
        donorPhone: formData.donorPhone || undefined,
        donorEmail: formData.donorEmail || undefined,
        donorAddress: formData.donorAddress || undefined,
        isAnonymous: formData.isAnonymous,
        type: formData.type,
        amount: parseInt(formData.amount),
        paymentMethod: formData.paymentMethod,
        notes: formData.notes || undefined,
      });

      setSuccessData({
        donorName: formData.isAnonymous ? "Hamba Allah" : formData.donorName,
        amount: parseInt(formData.amount),
      });

      // Reset form
      setFormData({
        donorName: "",
        donorPhone: "",
        donorEmail: "",
        donorAddress: "",
        isAnonymous: false,
        type: "INFAK",
        amount: "",
        paymentMethod: "BANK_TRANSFER",
        notes: "",
      });
      setSelectedCampaignId(null);
      setShowForm(false);
    } catch {
      toast.error("Gagal mengirim donasi. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [50000, 100000, 250000, 500000, 1000000, 2500000];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="bg-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Heart className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">CIPANSOR</h1>
                <p className="text-sm text-emerald-100">Portal Donasi Online</p>
              </div>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="text-white hover:bg-white/20">
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-emerald-600 text-white pb-20 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <HandHeart className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Mari Berbagi Kebaikan
          </h2>
          <p className="text-lg text-emerald-100 max-w-2xl mx-auto mb-8">
            Setiap donasi Anda akan membantu pengembangan pendidikan Islam dan
            memberikan manfaat bagi ribuan santri di Yayasan CIPANSOR
          </p>
          <Button
            size="lg"
            className="bg-white text-emerald-600 hover:bg-emerald-50"
            onClick={() => {
              setSelectedCampaignId(null);
              setShowForm(true);
            }}
          >
            <Gift className="h-5 w-5 mr-2" />
            Donasi Sekarang
          </Button>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Kampanye Aktif
                  </p>
                  <p className="text-2xl font-bold">{activeCampaigns.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Donatur</p>
                  <p className="text-2xl font-bold">
                    {activeCampaigns.reduce((sum, c) => sum + c.donorCount, 0)}+
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Banknote className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Terkumpul
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      activeCampaigns.reduce(
                        (sum, c) => sum + c.collectedAmount,
                        0,
                      ),
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Campaigns */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Kampanye Donasi</h3>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          ) : activeCampaigns.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Belum ada kampanye aktif saat ini
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSelectedCampaignId(null);
                    setShowForm(true);
                  }}
                >
                  Donasi Umum
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onDonate={() => {
                    setSelectedCampaignId(campaign.id);
                    setShowForm(true);
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Donation Types */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6 text-center">Jenis Donasi</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DONATION_TYPES.slice(0, 8).map((type) => (
              <Card
                key={type.value}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setFormData({ ...formData, type: type.value });
                  setShowForm(true);
                }}
              >
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="font-medium">{type.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Bank Info */}
        <section className="mb-12">
          <Card className="bg-emerald-50 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informasi Rekening
              </CardTitle>
              <CardDescription>
                Transfer donasi ke rekening berikut
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-white rounded-lg border">
                  <p className="font-semibold text-lg mb-2">
                    Bank Syariah Indonesia (BSI)
                  </p>
                  <p className="text-2xl font-mono font-bold text-emerald-600 mb-1">
                    7788990011
                  </p>
                  <p className="text-sm text-muted-foreground">
                    a.n. Yayasan CIPANSOR
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <p className="font-semibold text-lg mb-2">Bank Muamalat</p>
                  <p className="text-2xl font-mono font-bold text-emerald-600 mb-1">
                    1234567890
                  </p>
                  <p className="text-sm text-muted-foreground">
                    a.n. Yayasan CIPANSOR
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h4 className="font-semibold text-lg mb-2">Butuh Bantuan?</h4>
                  <p className="text-muted-foreground">
                    Hubungi kami untuk informasi lebih lanjut tentang donasi
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="tel:+6281234567890"
                    className="flex items-center gap-2 text-emerald-600 hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    0812-3456-7890
                  </a>
                  <a
                    href="mailto:donasi@cipansor.id"
                    className="flex items-center gap-2 text-emerald-600 hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    donasi@cipansor.id
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 Yayasan Pendidikan Islam CIPANSOR. Semua hak dilindungi.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            "Perumpamaan orang yang menginfakkan hartanya di jalan Allah seperti
            sebutir biji yang menumbuhkan tujuh tangkai, pada setiap tangkai ada
            seratus biji." (QS. Al-Baqarah: 261)
          </p>
        </div>
      </footer>

      {/* Donation Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-emerald-600" />
              Form Donasi
            </DialogTitle>
            <DialogDescription>
              Isi data donasi Anda. Donasi akan diverifikasi setelah pembayaran
              dikonfirmasi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {/* Quick Amount */}
            <div className="space-y-2">
              <Label>Nominal Donasi</Label>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant={
                      formData.amount === String(amount) ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setFormData({ ...formData, amount: String(amount) })
                    }
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Atau masukkan nominal lain"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                min={10000}
              />
            </div>

            {/* Donation Type */}
            <div className="space-y-2">
              <Label>Jenis Donasi</Label>
              <Select
                value={formData.type}
                onValueChange={(v) =>
                  setFormData({ ...formData, type: v as DonationType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DONATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAnonymous"
                checked={formData.isAnonymous}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isAnonymous: checked as boolean })
                }
              />
              <Label htmlFor="isAnonymous" className="cursor-pointer">
                Donasi sebagai Hamba Allah (Anonim)
              </Label>
            </div>

            {/* Donor Info */}
            {!formData.isAnonymous && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="donorName">Nama Lengkap *</Label>
                  <Input
                    id="donorName"
                    value={formData.donorName}
                    onChange={(e) =>
                      setFormData({ ...formData, donorName: e.target.value })
                    }
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="donorPhone">No. HP</Label>
                    <Input
                      id="donorPhone"
                      value={formData.donorPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, donorPhone: e.target.value })
                      }
                      placeholder="08xx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="donorEmail">Email</Label>
                    <Input
                      id="donorEmail"
                      type="email"
                      value={formData.donorEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, donorEmail: e.target.value })
                      }
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = paymentIcons[method.value];
                  return (
                    <Button
                      key={method.value}
                      type="button"
                      variant={
                        formData.paymentMethod === method.value
                          ? "default"
                          : "outline"
                      }
                      className="justify-start"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          paymentMethod: method.value,
                        })
                      }
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {method.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Pesan/Doa (Opsional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Tulis pesan atau doa..."
                rows={2}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Memproses..." : "Kirim Donasi"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={!!successData} onOpenChange={() => setSuccessData(null)}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="py-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Jazakallahu Khairan!</h3>
            <p className="text-muted-foreground mb-4">
              Terima kasih, <strong>{successData?.donorName}</strong>
            </p>
            <p className="text-2xl font-bold text-emerald-600 mb-4">
              {successData && formatCurrency(successData.amount)}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Donasi Anda sedang menunggu verifikasi. Kami akan menghubungi Anda
              setelah pembayaran dikonfirmasi.
            </p>
            <Button onClick={() => setSuccessData(null)} className="w-full">
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CampaignCard({
  campaign,
  onDonate,
}: {
  campaign: DonationCampaign;
  onDonate: () => void;
}) {
  const progress = calculateProgress(
    campaign.collectedAmount,
    campaign.targetAmount,
  );

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-40 bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
        <Heart className="h-16 w-16 text-white/50" />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">
            {campaign.title}
          </CardTitle>
          <Badge className="bg-emerald-100 text-emerald-800 shrink-0">
            Aktif
          </Badge>
        </div>
        {campaign.description && (
          <CardDescription className="line-clamp-2">
            {campaign.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-emerald-600">
              {formatCurrency(campaign.collectedAmount)}
            </span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            Target: {formatCurrency(campaign.targetAmount)}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {campaign.donorCount} donatur
          </span>
          {campaign.endDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              s/d{" "}
              {safeFormat(new Date(campaign.endDate), "d MMM", {
                locale: idLocale,
              })}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onDonate} className="w-full">
          Donasi Sekarang
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
}
