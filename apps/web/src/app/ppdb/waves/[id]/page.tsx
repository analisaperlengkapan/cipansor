"use client";

// Legacy `/ppdb/waves/[id]` detail page. The PSB and PPDB modules have been
// unified under `/admissions`, and `@/hooks/use-ppdb-wave` was deleted in
// favor of `@/hooks/use-admissions`. This file is reduced to a redirect to
// the new admissions wave UI so any old in-app links / bookmarks keep
// working without erroring out at build time on the now-missing imports.
//
// The live wave UI lives at `apps/web/src/app/admissions/waves/page.tsx`.
// The legacy ~540-line `WaveDetailPage` body that lived below has been
// deleted entirely (it referenced removed hooks `useWave`,
// `useWaveRegistrants`, `useUpdateWaveStatus`, `useUpdateRegistrantStatus`,
// `useUpdateRegistrantScores` and removed constants/utilities
// `WAVE_STATUSES`, `REGISTRANT_STATUSES`, `getNextStatus`,
// `calculateQuotaPercentage`, `formatRegistrationFee`).

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface __LegacyProps {
  params: Promise<{ id: string }>;
}

export default function LegacyWaveDetailRedirect(_props: __LegacyProps) {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admissions/waves");
  }, [router]);
  return null;
}
// The legacy `WaveDetailPage` implementation has been removed entirely.
// It referenced hooks (`useWave`, `useWaveRegistrants`, `useUpdateWaveStatus`,
// `useUpdateRegistrantStatus`, `useUpdateRegistrantScores`) and
// constants/utilities (`WAVE_STATUSES`, `REGISTRANT_STATUSES`,
// `getNextStatus`, `calculateQuotaPercentage`, `formatRegistrationFee`)
// that were deleted in this PR. The live wave UI lives at
// `apps/web/src/app/admissions/waves/page.tsx`.








      {/* Requirements & Description */}
      {(wave.requirements || wave.description) && (
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          {wave.requirements && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Persyaratan Pendaftaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm">
                  {wave.requirements}
                </p>
              </CardContent>
            </Card>
          )}
          {wave.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deskripsi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm">
                  {wave.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Registrants List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Daftar Pendaftar
              </CardTitle>
              <CardDescription>
                Total {pagination?.total || 0} pendaftar
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Status</SelectItem>
                  {REGISTRANT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button asChild>
                <Link href={`/ppdb/waves/${id}/registrants/new`}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Tambah Pendaftar
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Pendaftaran</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Orang Tua</TableHead>
                <TableHead>Tanggal Daftar</TableHead>
                <TableHead>Nilai</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrantsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : registrants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Belum ada pendaftar</p>
                    {wave.status === "OPEN" && (
                      <Button asChild className="mt-4">
                        <Link href={`/ppdb/waves/${id}/registrants/new`}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Tambah Pendaftar
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                registrants.map((registrant) => {
                  const nextStatus = getNextStatus(registrant.status);
                  return (
                    <TableRow key={registrant.id}>
                      <TableCell className="font-mono text-sm">
                        {registrant.registrationNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {registrant.studentName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {registrant.gender === "L"
                              ? "Laki-laki"
                              : "Perempuan"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{registrant.parentName}</p>
                          <p className="text-sm text-muted-foreground">
                            {registrant.parentPhone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(
                          new Date(registrant.registrationDate),
                          "d MMM yyyy",
                          {
                            locale: localeId,
                          },
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {registrant.testScore !== null && (
                            <p>
                              Tes:{" "}
                              <span className="font-medium">
                                {registrant.testScore}
                              </span>
                            </p>
                          )}
                          {registrant.interviewScore !== null && (
                            <p>
                              Interview:{" "}
                              <span className="font-medium">
                                {registrant.interviewScore}
                              </span>
                            </p>
                          )}
                          {registrant.finalScore !== null && (
                            <p className="font-bold text-primary">
                              Total: {registrant.finalScore}
                            </p>
                          )}
                          {registrant.testScore === null &&
                            registrant.interviewScore === null && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRegistrant(registrant.id);
                                  setScores({
                                    testScore:
                                      registrant.testScore?.toString() || "",
                                    interviewScore:
                                      registrant.interviewScore?.toString() ||
                                      "",
                                  });
                                  setScoreDialogOpen(true);
                                }}
                              >
                                Input Nilai
                              </Button>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRegistrantStatusBadge(registrant.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              href={`/ppdb/waves/${id}/registrants/${registrant.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {nextStatus && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRegistrantStatusChange(
                                  registrant.id,
                                  nextStatus,
                                )
                              }
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          {registrant.status !== "REJECTED" &&
                            registrant.status !== "ENROLLED" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRegistrantStatusChange(
                                    registrant.id,
                                    "REJECTED",
                                  )
                                }
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {pagination && (
        <div className="mt-4">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.limit}
            total={pagination.total}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      )}

      {/* Score Dialog */}
      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Input Nilai</DialogTitle>
            <DialogDescription>
              Masukkan nilai tes dan wawancara untuk pendaftar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nilai Tes</label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="0 - 100"
                value={scores.testScore}
                onChange={(e) =>
                  setScores({ ...scores, testScore: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nilai Wawancara</label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="0 - 100"
                value={scores.interviewScore}
                onChange={(e) =>
                  setScores({ ...scores, interviewScore: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoreDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSaveScores}
              disabled={updateScores.isPending}
            >
              {updateScores.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
DELETED-LEGACY-BLOCK-END */
