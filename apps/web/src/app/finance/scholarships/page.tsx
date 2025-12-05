"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  GraduationCap, 
  Users,
  RefreshCw,
  Award,
  Building2,
  HandCoins,
  Eye,
  UserPlus
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

import {
  useScholarships,
  useScholarshipRecipients,
  useCreateScholarship,
  useAssignScholarship,
  type Scholarship,
  type ScholarshipSource,
  type ScholarshipType,
  type ScholarshipRecipient,
} from "@/hooks/use-finance-enhancement";
import { useUnits } from "@/hooks/use-units";
import { useStudents } from "@/hooks/use-students";
import { useAcademicYears } from "@/hooks/use-academic-years";

// Scholarship source labels
const SCHOLARSHIP_SOURCES: { value: ScholarshipSource; label: string; icon: React.ReactNode }[] = [
  { value: "INTERNAL", label: "Internal", icon: <Building2 className="h-4 w-4" /> },
  { value: "GOVERNMENT", label: "Pemerintah", icon: <Award className="h-4 w-4" /> },
  { value: "COMPANY", label: "Perusahaan", icon: <HandCoins className="h-4 w-4" /> },
  { value: "FOUNDATION", label: "Yayasan", icon: <GraduationCap className="h-4 w-4" /> },
  { value: "OTHER", label: "Lainnya", icon: <Award className="h-4 w-4" /> },
];

// Scholarship type labels
const SCHOLARSHIP_TYPES: { value: ScholarshipType; label: string; color: string }[] = [
  { value: "FULL", label: "Penuh", color: "bg-green-500" },
  { value: "PARTIAL", label: "Sebagian", color: "bg-blue-500" },
  { value: "SPECIFIC", label: "Komponen Tertentu", color: "bg-purple-500" },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Scholarships List Tab
function ScholarshipsListTab() {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<ScholarshipSource | "ALL">("ALL");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);

  const { data: unitsData } = useUnits();
  const { data: scholarshipsData, isLoading, refetch } = useScholarships({
    source: sourceFilter === "ALL" ? undefined : sourceFilter,
  });

  const createScholarship = useCreateScholarship();

  const handleCreateScholarship = async (formData: FormData) => {
    try {
      await createScholarship.mutateAsync({
        name: formData.get("name") as string,
        description: formData.get("description") as string || undefined,
        source: formData.get("source") as ScholarshipSource,
        type: formData.get("type") as ScholarshipType,
        quota: parseInt(formData.get("quota") as string) || undefined,
        requirements: formData.get("requirements") as string || undefined,
        startDate: formData.get("startDate") as string,
        endDate: formData.get("endDate") as string || undefined,
        unitId: formData.get("unitId") as string || undefined,
        isActive: true,
      });
      toast.success("Beasiswa berhasil ditambahkan");
      setIsAddDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menambahkan beasiswa");
    }
  };

  const getSourceBadge = (source: ScholarshipSource) => {
    const sourceInfo = SCHOLARSHIP_SOURCES.find(s => s.value === source);
    return (
      <Badge variant="outline" className="flex items-center gap-1 w-fit">
        {sourceInfo?.icon}
        {sourceInfo?.label || source}
      </Badge>
    );
  };

  const getTypeBadge = (type: ScholarshipType) => {
    const typeInfo = SCHOLARSHIP_TYPES.find(t => t.value === type);
    return (
      <Badge className={`${typeInfo?.color} text-white border-0`}>
        {typeInfo?.label || type}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari beasiswa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as ScholarshipSource | "ALL")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter sumber" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Sumber</SelectItem>
            {SCHOLARSHIP_SOURCES.map((source) => (
              <SelectItem key={source.value} value={source.value}>
                {source.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Beasiswa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <form action={handleCreateScholarship}>
              <DialogHeader>
                <DialogTitle>Tambah Program Beasiswa</DialogTitle>
                <DialogDescription>
                  Buat program beasiswa baru untuk santri/siswa
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Beasiswa</Label>
                  <Input id="name" name="name" placeholder="Beasiswa Prestasi" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Deskripsi program beasiswa..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Sumber Dana</Label>
                    <Select name="source" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih sumber" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHOLARSHIP_SOURCES.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            {source.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Jenis Beasiswa</Label>
                    <Select name="type" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHOLARSHIP_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quota">Kuota Penerima</Label>
                    <Input id="quota" name="quota" type="number" min="1" placeholder="10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitId">Unit</Label>
                    <Select name="unitId">
                      <SelectTrigger>
                        <SelectValue placeholder="Semua unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Semua Unit</SelectItem>
                        {unitsData?.map((unit: any) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Tanggal Mulai</Label>
                    <Input id="startDate" name="startDate" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Tanggal Berakhir</Label>
                    <Input id="endDate" name="endDate" type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirements">Persyaratan</Label>
                  <Textarea 
                    id="requirements" 
                    name="requirements" 
                    placeholder="Persyaratan untuk mendapatkan beasiswa..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={createScholarship.isPending}>
                  {createScholarship.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Beasiswa</TableHead>
                <TableHead>Sumber</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Kuota</TableHead>
                <TableHead>Penerima</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : scholarshipsData?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Belum ada program beasiswa
                  </TableCell>
                </TableRow>
              ) : (
                scholarshipsData?.data
                  .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()))
                  .map((scholarship) => (
                  <TableRow key={scholarship.id}>
                    <TableCell>
                      <div className="font-medium">{scholarship.name}</div>
                      {scholarship.unit && (
                        <div className="text-xs text-muted-foreground">{scholarship.unit.name}</div>
                      )}
                    </TableCell>
                    <TableCell>{getSourceBadge(scholarship.source)}</TableCell>
                    <TableCell>{getTypeBadge(scholarship.type)}</TableCell>
                    <TableCell>{scholarship.quota || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {scholarship._count?.recipients || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={scholarship.isActive ? "default" : "secondary"}>
                        {scholarship.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedScholarship(scholarship)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Scholarship Detail Dialog */}
      {selectedScholarship && (
        <ScholarshipDetailDialog 
          scholarship={selectedScholarship}
          open={!!selectedScholarship}
          onOpenChange={(open) => !open && setSelectedScholarship(null)}
        />
      )}
    </div>
  );
}

// Scholarship Detail Dialog
function ScholarshipDetailDialog({ 
  scholarship, 
  open, 
  onOpenChange 
}: { 
  scholarship: Scholarship; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const [isAddRecipientOpen, setIsAddRecipientOpen] = useState(false);

  const { data: recipientsData, isLoading, refetch } = useScholarshipRecipients(scholarship.id);
  const { data: studentsData } = useStudents({ limit: 100 });
  const { data: academicYearsData } = useAcademicYears();

  const assignScholarship = useAssignScholarship();

  const handleAssignScholarship = async (formData: FormData) => {
    try {
      await assignScholarship.mutateAsync({
        scholarshipId: scholarship.id,
        studentId: formData.get("studentId") as string,
        academicYearId: formData.get("academicYearId") as string,
        startDate: formData.get("startDate") as string,
        endDate: formData.get("endDate") as string || undefined,
        notes: formData.get("notes") as string || undefined,
      });
      toast.success("Beasiswa berhasil diberikan");
      setIsAddRecipientOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memberikan beasiswa");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{scholarship.name}</DialogTitle>
          <DialogDescription>
            {scholarship.description || "Detail program beasiswa"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scholarship Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Sumber:</span>{" "}
              {SCHOLARSHIP_SOURCES.find(s => s.value === scholarship.source)?.label}
            </div>
            <div>
              <span className="text-muted-foreground">Jenis:</span>{" "}
              {SCHOLARSHIP_TYPES.find(t => t.value === scholarship.type)?.label}
            </div>
            <div>
              <span className="text-muted-foreground">Kuota:</span>{" "}
              {scholarship.quota || "Tidak terbatas"}
            </div>
            <div>
              <span className="text-muted-foreground">Periode:</span>{" "}
              {format(new Date(scholarship.startDate), "dd MMM yyyy", { locale: localeID })}
              {scholarship.endDate && ` - ${format(new Date(scholarship.endDate), "dd MMM yyyy", { locale: localeID })}`}
            </div>
          </div>

          {/* Requirements */}
          {scholarship.requirements && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">Persyaratan:</div>
              <div className="text-sm text-muted-foreground whitespace-pre-line">
                {scholarship.requirements}
              </div>
            </div>
          )}

          {/* Recipients Section */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Penerima Beasiswa</h4>
            <Dialog open={isAddRecipientOpen} onOpenChange={setIsAddRecipientOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Tambah Penerima
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form action={handleAssignScholarship}>
                  <DialogHeader>
                    <DialogTitle>Tambah Penerima Beasiswa</DialogTitle>
                    <DialogDescription>
                      Berikan beasiswa {scholarship.name} kepada santri/siswa
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Pilih Santri/Siswa</Label>
                      <Select name="studentId" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih santri/siswa" />
                        </SelectTrigger>
                        <SelectContent>
                          {studentsData?.data.map((student: any) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.nis} - {student.user?.name || student.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tahun Ajaran</Label>
                      <Select name="academicYearId" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tahun ajaran" />
                        </SelectTrigger>
                        <SelectContent>
                          {academicYearsData?.data.map((year: any) => (
                            <SelectItem key={year.id} value={year.id}>
                              {year.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tanggal Mulai</Label>
                        <Input name="startDate" type="date" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Tanggal Berakhir</Label>
                        <Input name="endDate" type="date" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Catatan</Label>
                      <Textarea name="notes" placeholder="Catatan tambahan..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddRecipientOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={assignScholarship.isPending}>
                      {assignScholarship.isPending ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Recipients Table */}
          <div className="border rounded-lg max-h-[300px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIS</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Tahun Ajaran</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : recipientsData?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      Belum ada penerima
                    </TableCell>
                  </TableRow>
                ) : (
                  recipientsData?.data.map((recipient) => (
                    <TableRow key={recipient.id}>
                      <TableCell className="font-mono">{recipient.student?.nis}</TableCell>
                      <TableCell>{recipient.student?.name}</TableCell>
                      <TableCell>{recipient.student?.class || "-"}</TableCell>
                      <TableCell>{recipient.academicYear?.name}</TableCell>
                      <TableCell>
                        <Badge variant={recipient.status === "ACTIVE" ? "default" : "secondary"}>
                          {recipient.status === "ACTIVE" ? "Aktif" : 
                           recipient.status === "SUSPENDED" ? "Ditangguhkan" : "Berakhir"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Recipients Overview Tab
function RecipientsOverviewTab() {
  const { data: scholarshipsData, isLoading } = useScholarships({ isActive: true });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <Card className="col-span-full">
            <CardContent className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Memuat data...
            </CardContent>
          </Card>
        ) : scholarshipsData?.data.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              Belum ada program beasiswa aktif
            </CardContent>
          </Card>
        ) : (
          scholarshipsData?.data.map((scholarship) => (
            <Card key={scholarship.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{scholarship.name}</CardTitle>
                <CardDescription>
                  {SCHOLARSHIP_SOURCES.find(s => s.value === scholarship.source)?.label}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {scholarship._count?.recipients || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {scholarship.quota ? `dari ${scholarship.quota} kuota` : "penerima"}
                    </div>
                  </div>
                  <div>
                    {scholarship.quota && (
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {Math.round(((scholarship._count?.recipients || 0) / scholarship.quota) * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">terisi</div>
                      </div>
                    )}
                  </div>
                </div>
                {scholarship.quota && (
                  <div className="mt-3 w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(((scholarship._count?.recipients || 0) / scholarship.quota) * 100, 100)}%` 
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Main Page
export default function ScholarshipsPage() {
  const [activeTab, setActiveTab] = useState("list");

  const { data: scholarshipsData } = useScholarships();
  
  const totalScholarships = scholarshipsData?.data.length || 0;
  const activeScholarships = scholarshipsData?.data.filter(s => s.isActive).length || 0;
  const totalRecipients = scholarshipsData?.data.reduce((sum, s) => sum + (s._count?.recipients || 0), 0) || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Manajemen Beasiswa"
          description="Kelola program beasiswa dan penerima beasiswa"
        />

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Program</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalScholarships}</div>
              <p className="text-xs text-muted-foreground">Program beasiswa</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Program Aktif</CardTitle>
              <Award className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeScholarships}</div>
              <p className="text-xs text-muted-foreground">Program berjalan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Penerima</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalRecipients}</div>
              <p className="text-xs text-muted-foreground">Santri/siswa</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sumber Dana</CardTitle>
              <HandCoins className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(scholarshipsData?.data.map(s => s.source)).size || 0}
              </div>
              <p className="text-xs text-muted-foreground">Jenis sumber</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Daftar Beasiswa
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Ringkasan Penerima
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <ScholarshipsListTab />
          </TabsContent>

          <TabsContent value="overview" className="mt-6">
            <RecipientsOverviewTab />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
