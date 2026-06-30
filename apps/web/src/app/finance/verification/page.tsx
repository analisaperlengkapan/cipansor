'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function PaymentVerificationPage() {
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch pending payments
  const { data: payments, isLoading } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: async () => {
      const res = await fetch('/api/finance/payments?status=PENDING_VERIFICATION');
      return res.json();
    }
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string, status: string, reason?: string }) => {
      const res = await fetch(`/api/finance/payments/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason: reason })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      toast.success('Status pembayaran berhasil diperbarui');
      setSelectedPayment(null);
      setRejectionReason('');
    }
  });

  if (isLoading) return <div>Memuat data...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Verifikasi Pembayaran SPP</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Invoice</TableHead>
              <TableHead>Nama Santri</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Tanggal Bayar</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments?.data?.map((payment: any) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.invoice.invoiceNumber}</TableCell>
                <TableCell>{payment.invoice.student.user.name}</TableCell>
                <TableCell>{payment.method}</TableCell>
                <TableCell>Rp {payment.amount.toLocaleString()}</TableCell>
                <TableCell>{new Date(payment.paidAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => setSelectedPayment(payment)}>
                    Detail / Verifikasi
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detail Pembayaran</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="grid gap-4 py-4">
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
                {selectedPayment.proofUrl ? (
                  <img src={selectedPayment.proofUrl} alt="Bukti Bayar" className="object-contain w-full h-full" />
                ) : (
                  <span className="text-gray-400 text-sm">Tidak ada bukti gambar</span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Alasan Penolakan (Jika ditolak):</p>
                <Input
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Misal: Bukti transfer tidak terbaca"
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => verifyMutation.mutate({ id: selectedPayment.id, status: 'REJECTED', reason: rejectionReason })}
            >
              Tolak
            </Button>
            <Button
              className="bg-green-600"
              onClick={() => verifyMutation.mutate({ id: selectedPayment.id, status: 'TU_APPROVED' })}
            >
              Setujui (TU)
            </Button>
            <Button
              className="bg-blue-600"
              onClick={() => verifyMutation.mutate({ id: selectedPayment.id, status: 'FINAL_APPROVED' })}
            >
              Setujui Final (Bendahara)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
