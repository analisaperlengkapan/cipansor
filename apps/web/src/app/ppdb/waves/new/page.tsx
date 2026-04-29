"use client";

// Legacy `/ppdb/waves/new` page. The PSB and PPDB modules have been unified
// under `/admissions`, and `@/hooks/use-ppdb-wave` was deleted in favor of
// `@/hooks/use-admissions`. This file is reduced to a client-side redirect so
// any old in-app links / bookmarks land on the new wave management UI at
// `apps/web/src/app/admissions/waves/page.tsx` instead of erroring out at
// build time on the now-missing imports.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewWavePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admissions/waves");
  }, [router]);

  return null;
}

// The legacy form implementation that lived below is wrapped in a
// pseudo-template-string literal so the TypeScript / JSX parser ignores its
// contents. This is a build-stability shim — it can be deleted entirely once
// nobody links to the old route.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const __LEGACY_PPDB_WAVES_NEW_DEAD_CODE = String.raw`

  return (
    <MainLayout>
      <PageHeader
        title="Buat Gelombang PPDB"
        description="Buat gelombang penerimaan peserta didik baru"
        backHref="/ppdb/waves"
        backLabel="Kembali"
      />

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-500" />
              Informasi Gelombang
            </CardTitle>
            <CardDescription>
              Lengkapi informasi gelombang pendaftaran dengan benar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nama Gelombang *</Label>
                <Input
                  id="name"
                  placeholder="Gelombang 1 - Jalur Prestasi"
                  {...register("name")}
                />
                <p className="text-sm text-muted-foreground">
                  Contoh: Gelombang 1, Jalur Prestasi, Jalur Reguler
                </p>
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Unit & Period */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Unit *</Label>
                  <Select
                    value={selectedUnitId}
                    onValueChange={(value) => setValue("unitId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units?.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.unitId && (
                    <p className="text-sm text-destructive">
                      {errors.unitId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Tahun Ajaran *</Label>
                  <Select
                    value={selectedPeriodId}
                    onValueChange={(value) => setValue("periodId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tahun ajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.periodId && (
                    <p className="text-sm text-destructive">
                      {errors.periodId.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tanggal Mulai *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !startDate && "text-muted-foreground",
                        )}
                      >
                        {startDate ? (
                          format(startDate, "PPP")
                        ) : (
                          <span>Pilih tanggal</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setValue("startDate", date)}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.startDate && (
                    <p className="text-sm text-destructive">
                      {errors.startDate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Berakhir *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !endDate && "text-muted-foreground",
                        )}
                      >
                        {endDate ? (
                          format(endDate, "PPP")
                        ) : (
                          <span>Pilih tanggal</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setValue("endDate", date)}
                        disabled={(date) => date < (startDate || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.endDate && (
                    <p className="text-sm text-destructive">
                      {errors.endDate.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Quota & Fee */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quota">Kuota *</Label>
                  <Input
                    id="quota"
                    type="number"
                    min={1}
                    placeholder="50"
                    {...register("quota")}
                  />
                  <p className="text-sm text-muted-foreground">
                    Jumlah maksimal peserta
                  </p>
                  {errors.quota && (
                    <p className="text-sm text-destructive">
                      {errors.quota.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationFee">Biaya Pendaftaran</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      id="registrationFee"
                      type="number"
                      min={0}
                      step={10000}
                      className="pl-10"
                      placeholder="250000"
                      {...register("registrationFee")}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Kosongkan atau 0 jika gratis
                  </p>
                  {errors.registrationFee && (
                    <p className="text-sm text-destructive">
                      {errors.registrationFee.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) =>
                    setValue("status", value as WaveStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    {WAVE_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Pilih DRAFT untuk menyimpan dulu, OPEN untuk membuka
                  pendaftaran
                </p>
                {errors.status && (
                  <p className="text-sm text-destructive">
                    {errors.status.message}
                  </p>
                )}
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <Label htmlFor="requirements">Persyaratan</Label>
                <Textarea
                  id="requirements"
                  placeholder="- Foto 3x4 (2 lembar)&#10;- Fotokopi KK&#10;- Fotokopi Akta Kelahiran&#10;- Ijazah / SKL"
                  rows={5}
                  {...register("requirements")}
                />
                <p className="text-sm text-muted-foreground">
                  Daftar persyaratan dokumen yang harus dipenuhi pendaftar
                </p>
                {errors.requirements && (
                  <p className="text-sm text-destructive">
                    {errors.requirements.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  placeholder="Informasi tambahan tentang gelombang pendaftaran ini..."
                  rows={3}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={createWave.isPending}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Batal
                </Button>
                <Button type="submit" disabled={createWave.isPending}>
                  {createWave.isPending ? "Menyimpan..." : "Buat Gelombang"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
`;
