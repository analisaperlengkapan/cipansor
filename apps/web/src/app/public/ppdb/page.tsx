'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  useActivePeriod,
  useCreateRegistration,
  Gender
} from '@/hooks/use-psb';
import { useUnits } from '@/hooks/use-units';
import {
  CheckCircle2,
  FileText,
  User,
  MapPin,
  Phone,
  Mail,
  BookOpen,
  Upload,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Users,
  Info,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';

interface FormData {
  // Student info
  fullName: string;
  nickname: string;
  gender: Gender | '';
  birthPlace: string;
  birthDate: string;
  nationalId: string;
  familyCardNumber: string;

  // Previous school
  previousSchool: string;
  previousSchoolAddress: string;
  graduationYear: string;

  // Parent info
  fatherName: string;
  fatherOccupation: string;
  fatherPhone: string;
  fatherEmail: string;
  motherName: string;
  motherOccupation: string;
  motherPhone: string;

  // Address
  address: string;
  village: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;

  // Quran
  quranAbility: string;
  memorizedJuz: string;

  // Unit
  unitId: string;
  periodId: string;
}

const initialFormData: FormData = {
  fullName: '',
  nickname: '',
  gender: '',
  birthPlace: '',
  birthDate: '',
  nationalId: '',
  familyCardNumber: '',
  previousSchool: '',
  previousSchoolAddress: '',
  graduationYear: '',
  fatherName: '',
  fatherOccupation: '',
  fatherPhone: '',
  fatherEmail: '',
  motherName: '',
  motherOccupation: '',
  motherPhone: '',
  address: '',
  village: '',
  district: '',
  city: '',
  province: '',
  postalCode: '',
  quranAbility: '',
  memorizedJuz: '',
  unitId: '',
  periodId: '',
};

const QURAN_ABILITIES = [
  { value: 'BELUM_BISA', label: 'Belum bisa membaca' },
  { value: 'IQRO', label: 'Masih Iqro' },
  { value: 'LANCAR', label: 'Lancar membaca Al-Quran' },
  { value: 'TARTIL', label: 'Tartil dan Tajwid baik' },
  { value: 'HAFIDZ', label: 'Sudah hafal beberapa juz' },
];

export default function PublicPPDBPage() {
  const [activeTab, setActiveTab] = useState('info');
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ registrationNumber: string; name: string } | null>(null);

  const { data: activePeriod } = useActivePeriod();
  const { data: units = [] } = useUnits();
  const createRegistration = useCreateRegistration();

  const [files, setFiles] = useState<{
    photo: File | null;
    birthCertificate: File | null;
    familyCard: File | null;
  }>({
    photo: null,
    birthCertificate: null,
    familyCard: null,
  });

  const steps = [
    { id: 'student', title: 'Data Calon Santri', icon: User },
    { id: 'parent', title: 'Data Orang Tua', icon: Users },
    { id: 'address', title: 'Alamat', icon: MapPin },
    { id: 'quran', title: 'Kemampuan Quran', icon: BookOpen },
    { id: 'documents', title: 'Dokumen', icon: Upload },
    { id: 'confirm', title: 'Konfirmasi', icon: CheckCircle2 },
  ];

  const handleNext = () => {
    // Validation per step
    if (currentStep === 0) {
      if (!formData.fullName || !formData.gender || !formData.birthPlace || !formData.birthDate || !formData.unitId) {
        toast.error('Lengkapi semua data yang wajib diisi');
        return;
      }
    }
    if (currentStep === 1) {
      if (!formData.fatherName || !formData.motherName || !formData.fatherPhone) {
        toast.error('Lengkapi data orang tua yang wajib diisi');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.address || !formData.city || !formData.province) {
        toast.error('Lengkapi alamat yang wajib diisi');
        return;
      }
    }
    // Quran step (3) is optional or has defaults
    
    // Document step (4)
    if (currentStep === 4) {
      // Optional for now or mandatory? Let's make photo mandatory
      // if (activePeriod?.requirements?.includes('photo') && !files.photo) {
      //    toast.error('Pas foto wajib diupload');
      //    return;
      // }
    }

    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof files) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [field]: e.target.files![0] }));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          formDataToSend.append(key, String(value));
        }
      });

      // Add files
      if (files.photo) formDataToSend.append('photo', files.photo);
      if (files.birthCertificate) formDataToSend.append('birthCertificate', files.birthCertificate);
      if (files.familyCard) formDataToSend.append('familyCard', files.familyCard);

      // Set period if not selected
      if (!formData.periodId && activePeriod) {
        formDataToSend.set('periodId', activePeriod.id);
      }

      const result = await createRegistration.mutateAsync(formDataToSend);

      setSuccessData({
        registrationNumber: result.registrationNumber || 'PSB-' + Date.now(),
        name: formData.fullName,
      });

      // Reset form
      setFormData(initialFormData);
      setFiles({ photo: null, birthCertificate: null, familyCard: null });
      setCurrentStep(0);
    } catch (error) {
      toast.error('Gagal mengirim pendaftaran. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentIcon = steps[currentStep].icon;

  // Use waves from activePeriod if available, otherwise use a default wave or empty
  // The type definition for RegistrationPeriod in shared/hooks might be missing waves property
  // We will cast activePeriod to any to access waves safely or check if it exists
  const activeWaveName = (activePeriod as any)?.waves?.find((w: any) => w.status === 'OPEN')?.name || 'Umum';

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <main className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
            Tahun Ajaran 2024/2025
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Pendaftaran Santri Baru Online
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Selamat datang di portal PSB Pesantren Cipansor. Silakan lengkapi formulir pendaftaran di bawah ini dengan data yang sebenar-benarnya.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="info">Informasi</TabsTrigger>
            <TabsTrigger value="register">Formulir Pendaftaran</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Alur Pendaftaran</CardTitle>
                <CardDescription>
                  Ikuti langkah-langkah berikut untuk mendaftar sebagai santri baru
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-primary text-primary-foreground">1</div>
                  <div>
                    <h3 className="font-semibold">Isi Formulir Online</h3>
                    <p className="text-sm text-muted-foreground">Lengkapi data diri calon santri, data orang tua, dan unggah dokumen yang diperlukan melalui form pendaftaran ini.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-muted">2</div>
                  <div>
                    <h3 className="font-semibold">Pembayaran Biaya Pendaftaran</h3>
                    <p className="text-sm text-muted-foreground">Lakukan transfer biaya pendaftaran sesuai nominal yang tertera setelah submit formulir.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-muted">3</div>
                  <div>
                    <h3 className="font-semibold">Ujian Seleksi</h3>
                    <p className="text-sm text-muted-foreground">Ikuti ujian seleksi masuk (Tes Akademik, Baca Al-Quran, dan Wawancara) sesuai jadwal yang ditentukan.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-muted">4</div>
                  <div>
                    <h3 className="font-semibold">Pengumuman Kelulusan</h3>
                    <p className="text-sm text-muted-foreground">Hasil seleksi akan diumumkan melalui website dan WhatsApp resmi pesantren.</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => setActiveTab('register')} className="w-full">
                  Mulai Pendaftaran
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            {!activePeriod ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Clock className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Pendaftaran Belum Dibuka</h3>
                  <p className="text-muted-foreground">
                    Mohon maaf, saat ini belum ada periode pendaftaran yang aktif. Silakan cek kembali nanti.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="mb-8">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{activePeriod.name}</CardTitle>
                        <CardDescription>
                          Gelombang {activeWaveName}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
                        Status: Dibuka
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <CardTitle>Langkah {currentStep + 1} dari {steps.length}</CardTitle>
                      <span className="text-sm text-muted-foreground font-medium">
                        {Math.round(((currentStep + 1) / steps.length) * 100)}% Selesai
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                      />
                    </div>
                    {/* Step Title */}
                    <div className="mt-4 flex items-center gap-2 text-primary font-medium">
                      {CurrentIcon && <CurrentIcon className="h-5 w-5" />}
                      {steps[currentStep].title}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 min-h-[400px]">
                    {/* Step 1: Student Data */}
                    {currentStep === 0 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Nama Lengkap (Sesuai Akta)</Label>
                            <Input
                              value={formData.fullName}
                              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                              placeholder="Masukkan nama lengkap"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Nama Panggilan</Label>
                            <Input
                              value={formData.nickname}
                              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                              placeholder="Masukkan nama panggilan"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Unit Pendidikan Tujuan</Label>
                            <Select value={formData.unitId} onValueChange={(v) => setFormData({ ...formData, unitId: v })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih unit" />
                              </SelectTrigger>
                              <SelectContent>
                                {units.map((unit) => (
                                  <SelectItem key={unit.id} value={unit.id}>
                                    {unit.name} ({unit.type})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Jenis Kelamin</Label>
                            <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v as Gender })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih jenis kelamin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MALE">Laki-laki</SelectItem>
                                <SelectItem value="FEMALE">Perempuan</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Tempat Lahir</Label>
                            <Input
                              value={formData.birthPlace}
                              onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                              placeholder="Kota kelahiran"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tanggal Lahir</Label>
                            <Input
                              type="date"
                              value={formData.birthDate}
                              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>NIK (Nomor Induk Kependudukan)</Label>
                            <Input
                              value={formData.nationalId}
                              onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                              placeholder="16 digit NIK"
                              maxLength={16}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Asal Sekolah</Label>
                            <Input
                              value={formData.previousSchool}
                              onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                              placeholder="Nama sekolah sebelumnya"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Parent Data */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <div className="space-y-4 border-b pb-4">
                          <h3 className="font-medium text-muted-foreground">Data Ayah</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Nama Ayah</Label>
                              <Input
                                value={formData.fatherName}
                                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Pekerjaan Ayah</Label>
                              <Input
                                value={formData.fatherOccupation}
                                onChange={(e) => setFormData({ ...formData, fatherOccupation: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>No. HP/WA Ayah</Label>
                              <Input
                                value={formData.fatherPhone}
                                onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                                placeholder="08..."
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="font-medium text-muted-foreground">Data Ibu</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Nama Ibu</Label>
                              <Input
                                value={formData.motherName}
                                onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Pekerjaan Ibu</Label>
                              <Input
                                value={formData.motherOccupation}
                                onChange={(e) => setFormData({ ...formData, motherOccupation: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>No. HP/WA Ibu</Label>
                              <Input
                                value={formData.motherPhone}
                                onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                                placeholder="08..."
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Address */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Alamat Lengkap</Label>
                          <Textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Nama jalan, RT/RW, Dusun/Lingkungan"
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Desa/Kelurahan</Label>
                            <Input
                              value={formData.village}
                              onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Kecamatan</Label>
                            <Input
                              value={formData.district}
                              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Kota/Kabupaten</Label>
                            <Input
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Provinsi</Label>
                            <Input
                              value={formData.province}
                              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Kode Pos</Label>
                            <Input
                              value={formData.postalCode}
                              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Quran Ability */}
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label>Kemampuan Membaca Al-Quran</Label>
                          <Select value={formData.quranAbility} onValueChange={(v) => setFormData({ ...formData, quranAbility: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kemampuan" />
                            </SelectTrigger>
                            <SelectContent>
                              {QURAN_ABILITIES.map((ability) => (
                                <SelectItem key={ability.value} value={ability.value}>
                                  {ability.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Jumlah Hafalan (Juz)</Label>
                          <Input
                            type="number"
                            value={formData.memorizedJuz}
                            onChange={(e) => setFormData({ ...formData, memorizedJuz: e.target.value })}
                            placeholder="Jika sudah hafal, tulis jumlah juz"
                            min={0}
                            max={30}
                          />
                          <p className="text-xs text-muted-foreground">
                            Kosongkan jika belum memiliki hafalan
                          </p>
                        </div>

                        <Card className="bg-amber-50 border-amber-200">
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                              <div className="text-sm">
                                <p className="font-medium text-amber-800">Catatan:</p>
                                <p className="text-amber-700">
                                  Kemampuan Al-Quran akan diuji saat tahap tes masuk. Isilah dengan jujur sesuai kondisi sebenarnya.
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Step 5: Documents */}
                    {currentStep === 4 && (
                      <div className="space-y-6">
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                              <div className="text-sm">
                                <p className="font-medium text-blue-800">Instruksi Upload:</p>
                                <p className="text-blue-700">
                                  Format file yang didukung: JPG, PNG, PDF. Ukuran maksimal 2MB per file.
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Pas Foto (3x4 Latar Biru)</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, 'photo')}
                            />
                            {files.photo && <p className="text-xs text-green-600">File terpilih: {files.photo.name}</p>}
                          </div>

                          <div className="space-y-2">
                            <Label>Akte Kelahiran</Label>
                            <Input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => handleFileChange(e, 'birthCertificate')}
                            />
                            {files.birthCertificate && <p className="text-xs text-green-600">File terpilih: {files.birthCertificate.name}</p>}
                          </div>

                          <div className="space-y-2">
                            <Label>Kartu Keluarga (KK)</Label>
                            <Input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => handleFileChange(e, 'familyCard')}
                            />
                            {files.familyCard && <p className="text-xs text-green-600">File terpilih: {files.familyCard.name}</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 6: Confirmation */}
                    {currentStep === 5 && (
                      <div className="space-y-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Data Calon Santri</CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm space-y-1">
                            <p><strong>Nama:</strong> {formData.fullName}</p>
                            <p><strong>Jenis Kelamin:</strong> {formData.gender === 'MALE' ? 'Laki-laki' : 'Perempuan'}</p>
                            <p><strong>TTL:</strong> {formData.birthPlace}, {formData.birthDate && format(new Date(formData.birthDate), 'd MMMM yyyy', { locale: idLocale })}</p>
                            <p><strong>Unit:</strong> {units.find(u => u.id === formData.unitId)?.name}</p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Data Orang Tua</CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm space-y-1">
                            <p><strong>Ayah:</strong> {formData.fatherName} ({formData.fatherPhone})</p>
                            <p><strong>Ibu:</strong> {formData.motherName}</p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Alamat</CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm">
                            <p>{formData.address}</p>
                            <p>{formData.village}, {formData.district}</p>
                            <p>{formData.city}, {formData.province} {formData.postalCode}</p>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Dokumen</CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm space-y-1">
                            <p className="flex items-center gap-2">
                                {files.photo ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-gray-400" />}
                                Pas Foto: {files.photo ? 'Terupload' : 'Belum diupload'}
                            </p>
                            <p className="flex items-center gap-2">
                                {files.birthCertificate ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-gray-400" />}
                                Akte Kelahiran: {files.birthCertificate ? 'Terupload' : 'Belum diupload'}
                            </p>
                            <p className="flex items-center gap-2">
                                {files.familyCard ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-gray-400" />}
                                Kartu Keluarga: {files.familyCard ? 'Terupload' : 'Belum diupload'}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                              <div className="text-sm">
                                <p className="font-medium text-blue-800">Pernyataan:</p>
                                <p className="text-blue-700">
                                  Dengan mengirim formulir ini, saya menyatakan bahwa data yang saya isikan adalah benar dan dapat dipertanggungjawabkan.
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={handlePrev}
                      disabled={currentStep === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Sebelumnya
                    </Button>
                    {currentStep < steps.length - 1 ? (
                      <Button onClick={handleNext}>
                        Selanjutnya
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Mengirim...' : 'Kirim Pendaftaran'}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Contact */}
        <Card className="mt-8 mb-12">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="font-semibold text-lg mb-2">Butuh Bantuan?</h4>
                <p className="text-muted-foreground">Hubungi panitia PSB untuk informasi lebih lanjut</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="tel:+6281234567890" className="flex items-center gap-2 text-blue-600 hover:underline">
                  <Phone className="h-4 w-4" />
                  0812-3456-7890
                </a>
                <a href="mailto:psb@cipansor.id" className="flex items-center gap-2 text-blue-600 hover:underline">
                  <Mail className="h-4 w-4" />
                  psb@cipansor.id
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">© 2024 Yayasan Pendidikan Islam CIPANSOR. Semua hak dilindungi.</p>
        </div>
      </footer>

      {/* Success Dialog */}
      <Dialog open={!!successData} onOpenChange={() => setSuccessData(null)}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Pendaftaran Berhasil!</h3>
            <p className="text-muted-foreground mb-4">
              Terima kasih, <strong>{successData?.name}</strong>
            </p>
            <Card className="bg-blue-50 mb-4">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Nomor Pendaftaran:</p>
                <p className="text-2xl font-mono font-bold text-blue-600">
                  {successData?.registrationNumber}
                </p>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground mb-6">
              Simpan nomor pendaftaran ini. Informasi selanjutnya akan dikirim via WhatsApp/SMS.
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
