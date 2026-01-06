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
      if (activePeriod?.requirements?.includes('photo') && !files.photo) {
         toast.error('Pas foto wajib diupload');
         return;
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
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

  // ... (inside render)

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
                    )}                    <Button
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
