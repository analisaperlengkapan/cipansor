"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, CreditCard, Download, Loader2 } from "lucide-react";

export default function PaymentPage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/psb/registrants/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
            // Find registration fee invoice
            const inv = data.data.invoices?.find((i: any) => i.paymentType?.code === 'REGISTRATION');
            if (inv) {
                setInvoice(inv);
            } else {
                setError("Tagihan pendaftaran tidak ditemukan.");
            }
        } else {
            setError("Data pendaftar tidak ditemukan.");
        }
      })
      .catch(err => {
          console.error(err);
          setError("Gagal memuat data.");
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
      return (
          <MainLayout>
              <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin" />
              </div>
          </MainLayout>
      );
  }

  if (error || !invoice) {
      return (
          <MainLayout>
              <div className="container py-10 text-center text-red-500">
                  {error || "Tagihan tidak tersedia."}
              </div>
          </MainLayout>
      );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-10 max-w-xl">
        <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold">Pendaftaran Berhasil!</h1>
            <p className="text-muted-foreground mt-2">
                Terima kasih telah mendaftar. Silakan selesaikan pembayaran biaya pendaftaran untuk melanjutkan proses seleksi.
            </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rincian Tagihan</CardTitle>
            <CardDescription>Invoice #{invoice.invoiceNumber}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center py-4 border-b">
                <span className="font-medium">Biaya Pendaftaran</span>
                <span className="text-xl font-bold">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(invoice.amount)}
                </span>
            </div>

            {/* Status Badge */}
            <div className="flex justify-between items-center">
                <span>Status:</span>
                <span className={`font-bold ${invoice.status === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>
                    {invoice.status}
                </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Instruksi Pembayaran
                </h4>
                <p className="text-sm text-muted-foreground">
                    Silakan transfer ke rekening berikut:
                </p>
                <div className="font-mono text-lg font-bold">
                    BSI 1234567890
                </div>
                <div className="text-sm">
                    a.n. Yayasan Pesantren Cipansor
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    *Harap menyertakan nomor invoice pada berita transfer
                </p>
            </div>

            <div className="flex flex-col gap-3">
                <Button className="w-full">
                    Konfirmasi Pembayaran
                </Button>
                <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Unduh Invoice
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
