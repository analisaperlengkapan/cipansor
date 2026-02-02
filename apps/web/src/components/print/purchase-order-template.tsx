import React from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

interface PurchaseOrderTemplateProps {
  data: any; // Using any for flexibility with the shared type, ideally PurchaseRequest
}

export const PurchaseOrderTemplate: React.FC<PurchaseOrderTemplateProps> = ({
  data,
}) => {
  const totalAmount = data.items.reduce(
    (sum: number, item: any) => sum + (Number(item.totalPrice) || 0),
    0
  );

  return (
    <div className="bg-white text-black p-8 max-w-[210mm] mx-auto min-h-[297mm] text-sm font-sans" id="printable-area">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
        <div className="flex gap-4 items-center">
          {/* Logo Placeholder - assuming generic or data.unit.logoUrl if available */}
          <div className="w-20 h-20 bg-gray-200 flex items-center justify-center border border-gray-300">
             <span className="text-xs text-center text-gray-500">Logo Yayasan</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">
              Purchase Order
            </h1>
            <h2 className="text-lg font-semibold">{data.unit?.name || "Yayasan Pesantren Cipansor"}</h2>
            <p className="text-gray-600 w-64 text-xs">
              {data.unit?.address || "Alamat Unit Tidak Tersedia"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="mb-2">
            <span className="block text-xs text-gray-500 uppercase font-bold">No. PO / Ref</span>
            <span className="text-lg font-mono font-bold">{data.code}</span>
          </div>
          <div>
            <span className="block text-xs text-gray-500 uppercase font-bold">Tanggal</span>
            <span>
              {format(new Date(data.date), "dd MMMM yyyy", { locale: idLocale })}
            </span>
          </div>
        </div>
      </div>

      {/* Vendor & Ship To */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="border p-4 rounded-sm">
          <h3 className="uppercase text-xs font-bold text-gray-500 mb-2 border-b pb-1">Kepada (Supplier)</h3>
          {data.preferredSupplier ? (
            <>
              <p className="font-bold text-base">{data.preferredSupplier.name}</p>
              <p>{data.preferredSupplier.address}</p>
              <p>{data.preferredSupplier.phone}</p>
            </>
          ) : (
            <p className="italic text-gray-400">Supplier Belum Ditentukan</p>
          )}
        </div>
        <div className="border p-4 rounded-sm">
          <h3 className="uppercase text-xs font-bold text-gray-500 mb-2 border-b pb-1">Dikirim Ke</h3>
          <p className="font-bold text-base">{data.unit?.name}</p>
          <p>{data.unit?.address}</p>
          <p>Attn: {data.requester?.name}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-y-2 border-black">
              <th className="py-2 px-3 text-left w-12">No</th>
              <th className="py-2 px-3 text-left">Deskripsi Barang</th>
              <th className="py-2 px-3 text-center w-24">Qty</th>
              <th className="py-2 px-3 text-right w-32">Harga Satuan</th>
              <th className="py-2 px-3 text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item: any, index: number) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-3 px-3 text-center align-top">{index + 1}</td>
                <td className="py-3 px-3 align-top">
                  <p className="font-semibold">{item.itemName}</p>
                  {item.assetCategory && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded">
                      {item.assetCategory.name}
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center align-top">
                  {item.quantity} {item.unit}
                </td>
                <td className="py-3 px-3 text-right align-top">
                  {formatCurrency(Number(item.estimatedPrice))}
                </td>
                <td className="py-3 px-3 text-right font-medium align-top">
                  {formatCurrency(Number(item.totalPrice))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black bg-gray-50">
              <td colSpan={4} className="py-3 px-3 text-right font-bold uppercase">Total Estimasi</td>
              <td className="py-3 px-3 text-right font-bold text-lg">
                {formatCurrency(totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Terms & Notes */}
      <div className="mb-12">
        <h3 className="uppercase text-xs font-bold text-gray-500 mb-1">Catatan / Keterangan</h3>
        <div className="border p-4 min-h-[80px] text-sm text-gray-700 bg-gray-50 rounded-sm">
          {data.description || "Tidak ada catatan tambahan."}
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-8 mt-auto pt-8 break-inside-avoid">
        <div className="text-center">
          <p className="text-xs uppercase font-bold text-gray-500 mb-16">Dibuat Oleh</p>
          <div className="border-t border-black pt-2">
            <p className="font-bold">{data.requester?.name}</p>
            <p className="text-xs text-gray-500">Pemohon</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase font-bold text-gray-500 mb-16">Disetujui Oleh</p>
          <div className="border-t border-black pt-2">
            <p className="font-bold">{data.approvedBy?.name || "(....................)"}</p>
            <p className="text-xs text-gray-500">Kepala Unit / Yayasan</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase font-bold text-gray-500 mb-16">Diterima Oleh (Supplier)</p>
          <div className="border-t border-black pt-2">
            <p className="font-bold">(....................)</p>
            <p className="text-xs text-gray-500">Tanda Tangan & Stempel</p>
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] text-gray-400 mt-8 print:hidden">
        * Dokumen ini dibuat secara otomatis oleh Sistem Informasi Manajemen Pesantren Cipansor
      </div>
    </div>
  );
};
