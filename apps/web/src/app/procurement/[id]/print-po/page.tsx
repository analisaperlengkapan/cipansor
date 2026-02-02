"use client";

import { useParams } from "next/navigation";
import { useProcurementDetail } from "@/hooks/use-procurement";
import { PurchaseOrderTemplate } from "@/components/print/purchase-order-template";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function PrintPurchaseOrderPage() {
  const { id } = useParams();
  const { data: request, isLoading } = useProcurementDetail(id as string);

  useEffect(() => {
    if (request) {
      document.title = `PO-${request.code}`;
    }
  }, [request]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Memuat data dokumen...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p>Data tidak ditemukan.</p>
        <Button asChild variant="outline">
          <Link href={`/procurement/${id}`}>Kembali</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
      {/* Toolbar - Hidden when printing */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/procurement/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Link>
        </Button>
        <div className="flex gap-2">
            <div className="text-sm text-muted-foreground mr-4 flex items-center">
                Tips: Gunakan ukuran kertas A4 dan matikan header/footer browser.
            </div>
          <Button onClick={handlePrint} size="sm">
            <Printer className="mr-2 h-4 w-4" /> Cetak Dokumen
          </Button>
        </div>
      </div>

      {/* Document Preview */}
      <div className="shadow-lg print:shadow-none">
        <PurchaseOrderTemplate data={request} />
      </div>
    </div>
  );
}
