'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Loader2, Download } from 'lucide-react';

const useBalanceSheet = (unitId: string, date: string) => {
  return useQuery({
    queryKey: ['balance-sheet', unitId, date],
    queryFn: async () => {
      const res = await api.get('/finance-enhancement/reports/balance-sheet', { params: { unitId, date } });
      return res.data.data;
    },
    enabled: !!unitId && !!date
  });
};

const useIncomeStatement = (unitId: string, startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['income-statement', unitId, startDate, endDate],
    queryFn: async () => {
      const res = await api.get('/finance-enhancement/reports/income-expense', { params: { unitId, startDate, endDate } });
      return res.data.data;
    },
    enabled: !!unitId && !!startDate && !!endDate
  });
};

// Recursive component for BS Tree
const AccountNode = ({ node, level = 0 }: { node: any, level?: number }) => (
  <>
    <div className={`flex justify-between py-2 border-b ${level === 0 ? 'font-bold bg-muted/50 px-2' : ''}`} style={{ paddingLeft: `${level * 20 + 8}px` }}>
      <span>{node.code} - {node.name}</span>
      <span>{formatCurrency(node.amount)}</span>
    </div>
    {node.children?.map((child: any) => (
      <AccountNode key={child.code} node={child} level={level + 1} />
    ))}
  </>
);

export default function FinanceReportsPage() {
  const { data: units } = useUnits();
  const [unitId, setUnitId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: bs, isLoading: bsLoading } = useBalanceSheet(unitId, date);
  const { data: pl, isLoading: plLoading } = useIncomeStatement(unitId, startDate, endDate);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Laporan Keuangan</h1>
        <Select value={unitId} onValueChange={setUnitId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Pilih Unit" />
          </SelectTrigger>
          <SelectContent>
            {units?.map((unit: any) => (
              <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="neraca" className="space-y-4">
        <TabsList>
          <TabsTrigger value="neraca">Neraca (Balance Sheet)</TabsTrigger>
          <TabsTrigger value="laba-rugi">Laba Rugi (Income Statement)</TabsTrigger>
        </TabsList>

        <TabsContent value="neraca" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Posisi Keuangan per {date}</CardTitle>
              <div className="flex gap-2">
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto" />
                <Button variant="outline"><Download className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              {bsLoading ? <Loader2 className="animate-spin" /> : bs ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Aktiva (Assets)</h3>
                    {bs.assets.items.map((node: any) => <AccountNode key={node.code} node={node} />)}
                    <div className="flex justify-between font-bold text-lg pt-4 border-t-2">
                      <span>Total Aktiva</span>
                      <span>{formatCurrency(bs.assets.total)}</span>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Kewajiban (Liabilities)</h3>
                      {bs.liabilities.items.map((node: any) => <AccountNode key={node.code} node={node} />)}
                      <div className="flex justify-between font-bold pt-2">
                        <span>Total Kewajiban</span>
                        <span>{formatCurrency(bs.liabilities.total)}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Ekuitas (Equity)</h3>
                      {bs.equity.items.map((node: any) => <AccountNode key={node.code} node={node} />)}
                      <div className="flex justify-between font-bold pt-2">
                        <span>Total Ekuitas</span>
                        <span>{formatCurrency(bs.equity.total)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-4 border-t-2">
                      <span>Total Pasiva</span>
                      <span>{formatCurrency(bs.liabilities.total + bs.equity.total)}</span>
                    </div>
                  </div>
                </div>
              ) : <div className="text-center py-8">Pilih Unit untuk melihat laporan.</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="laba-rugi" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Laporan Aktivitas {startDate} s/d {endDate}</CardTitle>
              <div className="flex gap-2">
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-auto" />
                <span className="self-center">-</span>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-auto" />
                <Button variant="outline"><Download className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              {plLoading ? <Loader2 className="animate-spin" /> : pl ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                      <div className="text-sm text-green-600">Total Pendapatan</div>
                      <div className="text-2xl font-bold text-green-700">{formatCurrency(pl.summary.totalIncome)}</div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                      <div className="text-sm text-red-600">Total Beban</div>
                      <div className="text-2xl font-bold text-red-700">{formatCurrency(pl.summary.totalExpense)}</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-sm text-blue-600">Surplus/Defisit</div>
                      <div className="text-2xl font-bold text-blue-700">{formatCurrency(pl.summary.netIncome)}</div>
                    </div>
                  </div>

                  {/* Detailed List (This normally needs grouping by type, simplified here) */}
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kode Akun</TableHead>
                          <TableHead>Nama Akun</TableHead>
                          <TableHead className="text-right">Pendapatan</TableHead>
                          <TableHead className="text-right">Beban</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pl.breakdown.map((item: any) => (
                          <TableRow key={item.accountCode}>
                            <TableCell>{item.accountCode}</TableCell>
                            <TableCell>{item.accountName}</TableCell>
                            <TableCell className="text-right">{item.income > 0 ? formatCurrency(item.income) : '-'}</TableCell>
                            <TableCell className="text-right">{item.expense > 0 ? formatCurrency(item.expense) : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : <div className="text-center py-8">Pilih Unit untuk melihat laporan.</div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
