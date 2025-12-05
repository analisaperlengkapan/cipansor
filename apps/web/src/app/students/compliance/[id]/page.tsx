'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  User,
  MapPin,
  Car,
  Heart,
  Users,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

import { MainLayout } from '@/components/layout/main-layout';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

import {
  useStudentCompliance,
  useUpdateStudentCompliance,
  UpdateStudentComplianceData,
  TRANSPORT_MODES,
} from '@/hooks/use-student-compliance';
import {
  useProvinces,
  useRegencies,
  useDistricts,
  useVillages,
} from '@/hooks/use-wilayah';

const EDUCATION_LEVELS = [
  { value: 'TIDAK_SEKOLAH', label: 'Tidak Sekolah' },
  { value: 'SD', label: 'SD/Sederajat' },
  { value: 'SMP', label: 'SMP/Sederajat' },
  { value: 'SMA', label: 'SMA/Sederajat' },
  { value: 'D1', label: 'D1' },
  { value: 'D2', label: 'D2' },
  { value: 'D3', label: 'D3' },
  { value: 'D4', label: 'D4/S1' },
  { value: 'S1', label: 'S1' },
  { value: 'S2', label: 'S2' },
  { value: 'S3', label: 'S3' },
];

const BLOOD_TYPES = ['A', 'B', 'AB', 'O'];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StudentComplianceEditPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  
  const { data: student, isLoading } = useStudentCompliance(id);
  const updateCompliance = useUpdateStudentCompliance();
  
  // Form state
  const [formData, setFormData] = useState<UpdateStudentComplianceData>({});
  
  // Wilayah state
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedRegency, setSelectedRegency] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  
  // Wilayah hooks
  const { data: provinces } = useProvinces();
  const { data: regencies } = useRegencies({ provinceId: selectedProvince || undefined });
  const { data: districts } = useDistricts({ regencyId: selectedRegency || undefined });
  const { data: villages } = useVillages({ districtId: selectedDistrict || undefined });
  
  // Initialize form data when student loads
  useEffect(() => {
    if (student) {
      setFormData({
        nisn: student.nisn || '',
        nik: student.nik || '',
        noAkta: student.noAkta || '',
        noKK: student.noKK || '',
        address: student.address || '',
        rt: student.rt || '',
        rw: student.rw || '',
        villageId: student.villageId || '',
        transportMode: student.transportMode || '',
        distance: student.distance || undefined,
        travelTime: student.travelTime || undefined,
        isKIP: student.isKIP || false,
        kipNumber: student.kipNumber || '',
        isPKH: student.isPKH || false,
        pkhNumber: student.pkhNumber || '',
        isKKS: student.isKKS || false,
        kksNumber: student.kksNumber || '',
        height: student.height || undefined,
        weight: student.weight || undefined,
        bloodType: student.bloodType || '',
        hasDisability: student.hasDisability || false,
        disabilityType: student.disabilityType || '',
        fatherName: student.fatherName || '',
        fatherNIK: student.fatherNIK || '',
        fatherBirthDate: student.fatherBirthDate?.split('T')[0] || '',
        fatherEducation: student.fatherEducation || '',
        fatherOccupation: student.fatherOccupation || '',
        fatherIncome: student.fatherIncome || undefined,
        motherName: student.motherName || '',
        motherNIK: student.motherNIK || '',
        motherBirthDate: student.motherBirthDate?.split('T')[0] || '',
        motherEducation: student.motherEducation || '',
        motherOccupation: student.motherOccupation || '',
        motherIncome: student.motherIncome || undefined,
        guardianName: student.guardianName || '',
        guardianNIK: student.guardianNIK || '',
        guardianRelation: student.guardianRelation || '',
        guardianPhone: student.guardianPhone || '',
      });
      
      // Set wilayah cascade
      if (student.village?.district?.regency?.province?.id) {
        setSelectedProvince(student.village.district.regency.province.id);
      }
      if (student.village?.district?.regency?.id) {
        setSelectedRegency(student.village.district.regency.id);
      }
      if (student.village?.district?.id) {
        setSelectedDistrict(student.village.district.id);
      }
    }
  }, [student]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateCompliance.mutateAsync({
        studentId: id,
        data: formData,
      });
      toast.success('Data berhasil disimpan');
      router.push('/students/compliance');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan data';
      toast.error(errorMessage);
    }
  };
  
  const updateField = (field: keyof UpdateStudentComplianceData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title={`Edit Kelengkapan Data: ${student?.name || ''}`}
        description="Lengkapi data siswa untuk kepatuhan Dapodik dan administrasi"
        backHref="/students/compliance"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Siswa', href: '/students' },
          { label: 'Kelengkapan Data', href: '/students/compliance' },
          { label: 'Edit' },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Identity Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Data Identitas</CardTitle>
              </div>
              <CardDescription>
                Data identitas resmi siswa (NISN, NIK, Akta, KK)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nisn">NISN (Nomor Induk Siswa Nasional) *</Label>
                  <Input
                    id="nisn"
                    placeholder="10 digit NISN"
                    maxLength={10}
                    value={formData.nisn || ''}
                    onChange={(e) => updateField('nisn', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nik">NIK (Nomor Induk Kependudukan) *</Label>
                  <Input
                    id="nik"
                    placeholder="16 digit NIK"
                    maxLength={16}
                    value={formData.nik || ''}
                    onChange={(e) => updateField('nik', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noAkta">Nomor Akta Lahir *</Label>
                  <Input
                    id="noAkta"
                    placeholder="Nomor akta kelahiran"
                    value={formData.noAkta || ''}
                    onChange={(e) => updateField('noAkta', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noKK">Nomor Kartu Keluarga *</Label>
                  <Input
                    id="noKK"
                    placeholder="16 digit No. KK"
                    maxLength={16}
                    value={formData.noKK || ''}
                    onChange={(e) => updateField('noKK', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Data Alamat</CardTitle>
              </div>
              <CardDescription>
                Alamat tempat tinggal sesuai KK
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Alamat Lengkap *</Label>
                <Textarea
                  id="address"
                  placeholder="Jalan, nomor rumah, nama gedung, dll."
                  value={formData.address || ''}
                  onChange={(e) => updateField('address', e.target.value)}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="rt">RT</Label>
                  <Input
                    id="rt"
                    placeholder="001"
                    value={formData.rt || ''}
                    onChange={(e) => updateField('rt', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rw">RW</Label>
                  <Input
                    id="rw"
                    placeholder="001"
                    value={formData.rw || ''}
                    onChange={(e) => updateField('rw', e.target.value)}
                  />
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Provinsi *</Label>
                  <Select 
                    value={selectedProvince} 
                    onValueChange={(val) => {
                      setSelectedProvince(val);
                      setSelectedRegency('');
                      setSelectedDistrict('');
                      updateField('villageId', '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih provinsi" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces?.map((province) => (
                        <SelectItem key={province.id} value={province.id}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kabupaten/Kota *</Label>
                  <Select 
                    value={selectedRegency} 
                    onValueChange={(val) => {
                      setSelectedRegency(val);
                      setSelectedDistrict('');
                      updateField('villageId', '');
                    }}
                    disabled={!selectedProvince}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kabupaten/kota" />
                    </SelectTrigger>
                    <SelectContent>
                      {regencies?.map((regency) => (
                        <SelectItem key={regency.id} value={regency.id}>
                          {regency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kecamatan *</Label>
                  <Select 
                    value={selectedDistrict} 
                    onValueChange={(val) => {
                      setSelectedDistrict(val);
                      updateField('villageId', '');
                    }}
                    disabled={!selectedRegency}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kecamatan" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts?.map((district) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kelurahan/Desa *</Label>
                  <Select 
                    value={formData.villageId || ''} 
                    onValueChange={(val) => updateField('villageId', val)}
                    disabled={!selectedDistrict}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kelurahan/desa" />
                    </SelectTrigger>
                    <SelectContent>
                      {villages?.map((village) => (
                        <SelectItem key={village.id} value={village.id}>
                          {village.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transport Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Data Transportasi</CardTitle>
              </div>
              <CardDescription>
                Informasi transportasi ke sekolah
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Moda Transportasi</Label>
                  <Select 
                    value={formData.transportMode || ''} 
                    onValueChange={(val) => updateField('transportMode', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih moda transportasi" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSPORT_MODES.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distance">Jarak ke Sekolah (km)</Label>
                  <Input
                    id="distance"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={formData.distance || ''}
                    onChange={(e) => updateField('distance', parseFloat(e.target.value) || undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="travelTime">Waktu Tempuh (menit)</Label>
                  <Input
                    id="travelTime"
                    type="number"
                    placeholder="0"
                    value={formData.travelTime || ''}
                    onChange={(e) => updateField('travelTime', parseInt(e.target.value) || undefined)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Welfare Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Data Kesejahteraan</CardTitle>
              </div>
              <CardDescription>
                Data program bantuan pemerintah (KIP, PKH, KKS)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isKIP"
                      checked={formData.isKIP || false}
                      onCheckedChange={(checked) => updateField('isKIP', checked)}
                    />
                    <Label htmlFor="isKIP">Penerima KIP</Label>
                  </div>
                  {formData.isKIP && (
                    <Input
                      placeholder="Nomor KIP"
                      value={formData.kipNumber || ''}
                      onChange={(e) => updateField('kipNumber', e.target.value)}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPKH"
                      checked={formData.isPKH || false}
                      onCheckedChange={(checked) => updateField('isPKH', checked)}
                    />
                    <Label htmlFor="isPKH">Penerima PKH</Label>
                  </div>
                  {formData.isPKH && (
                    <Input
                      placeholder="Nomor PKH"
                      value={formData.pkhNumber || ''}
                      onChange={(e) => updateField('pkhNumber', e.target.value)}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isKKS"
                      checked={formData.isKKS || false}
                      onCheckedChange={(checked) => updateField('isKKS', checked)}
                    />
                    <Label htmlFor="isKKS">Penerima KKS</Label>
                  </div>
                  {formData.isKKS && (
                    <Input
                      placeholder="Nomor KKS"
                      value={formData.kksNumber || ''}
                      onChange={(e) => updateField('kksNumber', e.target.value)}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Data Kesehatan</CardTitle>
              </div>
              <CardDescription>
                Informasi kesehatan dan fisik siswa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Tinggi Badan (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="0"
                    value={formData.height || ''}
                    onChange={(e) => updateField('height', parseInt(e.target.value) || undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Berat Badan (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="0"
                    value={formData.weight || ''}
                    onChange={(e) => updateField('weight', parseInt(e.target.value) || undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Golongan Darah</Label>
                  <Select 
                    value={formData.bloodType || ''} 
                    onValueChange={(val) => updateField('bloodType', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasDisability"
                    checked={formData.hasDisability || false}
                    onCheckedChange={(checked) => updateField('hasDisability', checked)}
                  />
                  <Label htmlFor="hasDisability">Memiliki Disabilitas</Label>
                </div>
                {formData.hasDisability && (
                  <Input
                    placeholder="Jenis disabilitas"
                    value={formData.disabilityType || ''}
                    onChange={(e) => updateField('disabilityType', e.target.value)}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Father Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Data Ayah</CardTitle>
              </div>
              <CardDescription>
                Informasi data orang tua (ayah)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fatherName">Nama Lengkap Ayah *</Label>
                  <Input
                    id="fatherName"
                    placeholder="Nama ayah sesuai KTP"
                    value={formData.fatherName || ''}
                    onChange={(e) => updateField('fatherName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fatherNIK">NIK Ayah</Label>
                  <Input
                    id="fatherNIK"
                    placeholder="16 digit NIK"
                    maxLength={16}
                    value={formData.fatherNIK || ''}
                    onChange={(e) => updateField('fatherNIK', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fatherBirthDate">Tanggal Lahir</Label>
                  <Input
                    id="fatherBirthDate"
                    type="date"
                    value={formData.fatherBirthDate || ''}
                    onChange={(e) => updateField('fatherBirthDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pendidikan Terakhir</Label>
                  <Select 
                    value={formData.fatherEducation || ''} 
                    onValueChange={(val) => updateField('fatherEducation', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pendidikan" />
                    </SelectTrigger>
                    <SelectContent>
                      {EDUCATION_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fatherOccupation">Pekerjaan</Label>
                  <Input
                    id="fatherOccupation"
                    placeholder="Pekerjaan ayah"
                    value={formData.fatherOccupation || ''}
                    onChange={(e) => updateField('fatherOccupation', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fatherIncome">Penghasilan per Bulan (Rp)</Label>
                  <Input
                    id="fatherIncome"
                    type="number"
                    placeholder="0"
                    value={formData.fatherIncome || ''}
                    onChange={(e) => updateField('fatherIncome', parseInt(e.target.value) || undefined)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mother Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Data Ibu</CardTitle>
              </div>
              <CardDescription>
                Informasi data orang tua (ibu)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="motherName">Nama Lengkap Ibu *</Label>
                  <Input
                    id="motherName"
                    placeholder="Nama ibu sesuai KTP"
                    value={formData.motherName || ''}
                    onChange={(e) => updateField('motherName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherNIK">NIK Ibu</Label>
                  <Input
                    id="motherNIK"
                    placeholder="16 digit NIK"
                    maxLength={16}
                    value={formData.motherNIK || ''}
                    onChange={(e) => updateField('motherNIK', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherBirthDate">Tanggal Lahir</Label>
                  <Input
                    id="motherBirthDate"
                    type="date"
                    value={formData.motherBirthDate || ''}
                    onChange={(e) => updateField('motherBirthDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pendidikan Terakhir</Label>
                  <Select 
                    value={formData.motherEducation || ''} 
                    onValueChange={(val) => updateField('motherEducation', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pendidikan" />
                    </SelectTrigger>
                    <SelectContent>
                      {EDUCATION_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherOccupation">Pekerjaan</Label>
                  <Input
                    id="motherOccupation"
                    placeholder="Pekerjaan ibu"
                    value={formData.motherOccupation || ''}
                    onChange={(e) => updateField('motherOccupation', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherIncome">Penghasilan per Bulan (Rp)</Label>
                  <Input
                    id="motherIncome"
                    type="number"
                    placeholder="0"
                    value={formData.motherIncome || ''}
                    onChange={(e) => updateField('motherIncome', parseInt(e.target.value) || undefined)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guardian Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Data Wali (Opsional)</CardTitle>
              </div>
              <CardDescription>
                Informasi wali jika berbeda dengan orang tua
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="guardianName">Nama Wali</Label>
                  <Input
                    id="guardianName"
                    placeholder="Nama wali"
                    value={formData.guardianName || ''}
                    onChange={(e) => updateField('guardianName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardianNIK">NIK Wali</Label>
                  <Input
                    id="guardianNIK"
                    placeholder="16 digit NIK"
                    maxLength={16}
                    value={formData.guardianNIK || ''}
                    onChange={(e) => updateField('guardianNIK', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardianRelation">Hubungan dengan Siswa</Label>
                  <Input
                    id="guardianRelation"
                    placeholder="Paman, Kakak, dll."
                    value={formData.guardianRelation || ''}
                    onChange={(e) => updateField('guardianRelation', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardianPhone">No. HP Wali</Label>
                  <Input
                    id="guardianPhone"
                    placeholder="08xxxxxxxxxx"
                    value={formData.guardianPhone || ''}
                    onChange={(e) => updateField('guardianPhone', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/students/compliance">
                Batal
              </Link>
            </Button>
            <Button type="submit" disabled={updateCompliance.isPending}>
              {updateCompliance.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </MainLayout>
  );
}
