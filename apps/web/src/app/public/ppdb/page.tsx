'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  useActivePeriod,
  useRegistrationPeriods, 
  useCreateRegistration,
  RegistrationPeriod,
  Gender
} from '@/hooks/use-psb';
import { useUnits } from '@/hooks/use-units';
import { 
  GraduationCap, 
  Calendar,
  Users,
  Clock,
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
  Building2,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Link from 'next/link';

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

  const { data: activePeriod, isLoading: periodLoading } = useActivePeriod();
  const { data: periods = [] } = useRegistrationPeriods({ isActive: true });
  const { data: units = [] } = useUnits();
  
  const createRegistration = useCreateRegistration();

  const steps = [
    { id: 'student', title: 'Data Calon Santri', icon: User },
    { id: 'parent', title: 'Data Orang Tua', icon: Users },
    { id: 'address', title: 'Alamat', icon: MapPin },
    { id: 'quran', title: 'Kemampuan Quran', icon: BookOpen },
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
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
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
      setCurrentStep(0);
    } catch (error) {
      toast.error('Gagal mengirim pendaftaran. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(new Date(endDate), new Date());
    return days > 0 ? days : 0;
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">CIPANSOR</h1>
                <p className="text-sm text-blue-100">Penerimaan Peserta Didik Baru</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="ghost" className="text-white hover:bg-white/20">
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-blue-600 text-white pb-20 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pendaftaran Santri Baru
          </h2>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Daftarkan putra-putri Anda untuk bergabung di Yayasan Pendidikan Islam CIPANSOR
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg rounded-lg mb-6">
            <TabsTrigger value="info">Informasi</TabsTrigger>
            <TabsTrigger value="register">Pendaftaran</TabsTrigger>
            <TabsTrigger value="check">Cek Status</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-6">
            {/* Active Period Card */}
            {periodLoading ? (
              <Skeleton className="h-48" />
            ) : activePeriod ? (
              <Card className="bg-white shadow-lg border-l-4 border-blue-600">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className="bg-green-100 text-green-800 mb-2">Pendaftaran Dibuka</Badge>
                      <CardTitle className="text-xl">{activePeriod.name}</CardTitle>
                      <CardDescription>
                        Tahun Ajaran {activePeriod.academicYear?.name}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600">
                        {getDaysRemaining(activePeriod.endDate)}
                      </p>
                      <p className="text-sm text-muted-foreground">hari tersisa</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Calendar className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                      <p className="text-sm text-muted-foreground">Mulai</p>
                      <p className="font-semibold">{format(new Date(activePeriod.startDate), 'd MMM yyyy', { locale: idLocale })}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Clock className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                      <p className="text-sm text-muted-foreground">Berakhir</p>
                      <p className="font-semibold">{format(new Date(activePeriod.endDate), 'd MMM yyyy', { locale: idLocale })}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Users className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                      <p className="text-sm text-muted-foreground">Kuota</p>
                      <p className="font-semibold">{activePeriod.quota} santri</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <FileText className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                      <p className="text-sm text-muted-foreground">Biaya Pendaftaran</p>
                      <p className="font-semibold">{formatCurrency(activePeriod.registrationFee)}</p>
                    </div>
                  </div>
                  {activePeriod.description && (
                    <p className="text-muted-foreground">{activePeriod.description}</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button className="w-full" size="lg" onClick={() => setActiveTab('register')}>
                    Daftar Sekarang
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Pendaftaran Belum Dibuka</h3>
                  <p className="text-muted-foreground">
                    Saat ini tidak ada periode pendaftaran yang aktif. Silakan cek kembali nanti.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Units Info */}
            <div>
              <h3 className="text-xl font-bold mb-4">Unit Pendidikan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {units.map((unit) => (
                  <Card key={unit.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                        <GraduationCap className="h-6 w-6 text-blue-600" />
                      </div>
                      <CardTitle className="text-lg">{unit.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {unit.type === 'PESANTREN' && 'Program Tahfidz & Kepesantrenan'}
                        {unit.type === 'SD_IT' && 'Sekolah Dasar Islam Terpadu (6-12 tahun)'}
                        {unit.type === 'SMP_IT' && 'Sekolah Menengah Pertama Islam Terpadu (12-15 tahun)'}
                        {unit.type === 'SMA_IT' && 'Sekolah Menengah Atas Islam Terpadu (15-18 tahun)'}
                        {unit.type === 'MA' && 'Madrasah Aliyah Al-Quran (15-18 tahun)'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Persyaratan Pendaftaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Dokumen yang Diperlukan:</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Pas foto 3x4 (latar biru)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Fotokopi akta kelahiran
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Fotokopi kartu keluarga
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Fotokopi ijazah/SKL (jika ada)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Surat keterangan sehat
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Tahapan Seleksi:</h4>
                    <ol className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                        Pengisian formulir online
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                        Verifikasi dokumen
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                        Tes baca Al-Quran & akademik
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">4</span>
                        Wawancara orang tua & calon santri
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">5</span>
                        Pengumuman hasil seleksi
                      </li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register" className="space-y-6">
            {!activePeriod ? (
              <Card className="text-center py-12">
                <CardContent>
                  <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Pendaftaran Belum Dibuka</h3>
                  <p className="text-muted-foreground mb-4">
                    Silakan cek tab Informasi untuk melihat periode pendaftaran yang tersedia.
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab('info')}>
                    Lihat Informasi
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Steps Progress */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      {steps.map((step, idx) => {
                        const Icon = step.icon;
                        const isActive = idx === currentStep;
                        const isCompleted = idx < currentStep;

                        return (
                          <div key={step.id} className="flex items-center">
                            <div className="flex flex-col items-center">
                              <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center transition-colors
                                ${isCompleted ? 'bg-green-600 text-white' : ''}
                                ${isActive ? 'bg-blue-600 text-white' : ''}
                                ${!isCompleted && !isActive ? 'bg-gray-200 text-gray-500' : ''}
                              `}>
                                {isCompleted ? (
                                  <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                  <Icon className="h-5 w-5" />
                                )}
                              </div>
                              <span className={`text-xs mt-1 ${isActive ? 'font-semibold text-blue-600' : 'text-muted-foreground'}`}>
                                {step.title}
                              </span>
                            </div>
                            {idx < steps.length - 1 && (
                              <div className={`w-12 md:w-24 h-1 mx-2 rounded ${idx < currentStep ? 'bg-green-600' : 'bg-gray-200'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Form Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>{steps[currentStep].title}</CardTitle>
                    <CardDescription>
                      Langkah {currentStep + 1} dari {steps.length}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Step 1: Student Data */}
                    {currentStep === 0 && (
                      <>
                        <div className="space-y-2">
                          <Label>Unit Pendidikan *</Label>
                          <Select value={formData.unitId} onValueChange={(v) => setFormData({ ...formData, unitId: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih unit pendidikan" />
                            </SelectTrigger>
                            <SelectContent>
                              {units.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id}>
                                  {unit.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Nama Lengkap *</Label>
                            <Input
                              value={formData.fullName}
                              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                              placeholder="Sesuai akta kelahiran"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Nama Panggilan</Label>
                            <Input
                              value={formData.nickname}
                              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                              placeholder="Nama panggilan sehari-hari"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Jenis Kelamin *</Label>
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
                          <div className="space-y-2">
                            <Label>Tanggal Lahir *</Label>
                            <Input
                              type="date"
                              value={formData.birthDate}
                              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Tempat Lahir *</Label>
                            <Input
                              value={formData.birthPlace}
                              onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                              placeholder="Kota/kabupaten tempat lahir"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>NIK (Nomor Induk Kependudukan)</Label>
                            <Input
                              value={formData.nationalId}
                              onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                              placeholder="16 digit NIK"
                              maxLength={16}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Asal Sekolah</Label>
                            <Input
                              value={formData.previousSchool}
                              onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                              placeholder="Nama sekolah sebelumnya"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tahun Lulus</Label>
                            <Input
                              type="number"
                              value={formData.graduationYear}
                              onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                              placeholder="Contoh: 2024"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Step 2: Parent Data */}
                    {currentStep === 1 && (
                      <>
                        <div className="p-4 bg-blue-50 rounded-lg mb-4">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Data Ayah
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Nama Ayah *</Label>
                              <Input
                                value={formData.fatherName}
                                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                                placeholder="Nama lengkap ayah"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Pekerjaan</Label>
                              <Input
                                value={formData.fatherOccupation}
                                onChange={(e) => setFormData({ ...formData, fatherOccupation: e.target.value })}
                                placeholder="Pekerjaan ayah"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>No. HP *</Label>
                              <Input
                                value={formData.fatherPhone}
                                onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                                placeholder="08xx"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={formData.fatherEmail}
                                onChange={(e) => setFormData({ ...formData, fatherEmail: e.target.value })}
                                placeholder="email@example.com"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-pink-50 rounded-lg">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Data Ibu
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Nama Ibu *</Label>
                              <Input
                                value={formData.motherName}
                                onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                                placeholder="Nama lengkap ibu"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Pekerjaan</Label>
                              <Input
                                value={formData.motherOccupation}
                                onChange={(e) => setFormData({ ...formData, motherOccupation: e.target.value })}
                                placeholder="Pekerjaan ibu"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>No. HP</Label>
                              <Input
                                value={formData.motherPhone}
                                onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                                placeholder="08xx"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Step 3: Address */}
                    {currentStep === 2 && (
                      <>
                        <div className="space-y-2">
                          <Label>Alamat Lengkap *</Label>
                          <Textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Nama jalan, RT/RW, nomor rumah..."
                            rows={2}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Kelurahan/Desa</Label>
                            <Input
                              value={formData.village}
                              onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                              placeholder="Nama kelurahan/desa"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Kecamatan</Label>
                            <Input
                              value={formData.district}
                              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                              placeholder="Nama kecamatan"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Kota/Kabupaten *</Label>
                            <Input
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              placeholder="Nama kota/kabupaten"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Provinsi *</Label>
                            <Input
                              value={formData.province}
                              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                              placeholder="Nama provinsi"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Kode Pos</Label>
                            <Input
                              value={formData.postalCode}
                              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                              placeholder="Kode pos"
                              maxLength={5}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Step 4: Quran Ability */}
                    {currentStep === 3 && (
                      <>
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
                      </>
                    )}

                    {/* Step 5: Confirmation */}
                    {currentStep === 4 && (
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

          {/* Check Status Tab */}
          <TabsContent value="check">
            <Card>
              <CardHeader>
                <CardTitle>Cek Status Pendaftaran</CardTitle>
                <CardDescription>
                  Masukkan nomor pendaftaran untuk melihat status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Contoh: PSB-2024-0001" className="flex-1" />
                  <Button>Cek Status</Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Nomor pendaftaran dikirimkan via SMS/WhatsApp setelah formulir disubmit.
                </p>
              </CardContent>
            </Card>
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
