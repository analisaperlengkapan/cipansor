'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  useCreateRegistration,
  useRegistrationPeriods,
} from '@/hooks';
import { useUnits } from '@/hooks';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const registrationSchema = z.object({
  periodId: z.string().min(1, 'Periode pendaftaran wajib dipilih'),
  unitId: z.string().min(1, 'Unit tujuan wajib dipilih'),
  fullName: z.string().min(1, 'Nama lengkap wajib diisi'),
  nickname: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE'], { required_error: 'Jenis kelamin wajib dipilih' }),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi'),
  nationalId: z.string().optional(),
  familyCardNumber: z.string().optional(),
  
  previousSchool: z.string().optional(),
  previousSchoolAddress: z.string().optional(),
  graduationYear: z.string().optional(),
  
  fatherName: z.string().min(1, 'Nama ayah wajib diisi'),
  fatherOccupation: z.string().optional(),
  fatherPhone: z.string().optional(),
  fatherEmail: z.string().email().optional().or(z.literal('')),
  motherName: z.string().min(1, 'Nama ibu wajib diisi'),
  motherOccupation: z.string().optional(),
  motherPhone: z.string().optional(),
  
  address: z.string().min(1, 'Alamat wajib diisi'),
  village: z.string().min(1, 'Desa/Kelurahan wajib diisi'),
  district: z.string().min(1, 'Kecamatan wajib diisi'),
  city: z.string().min(1, 'Kota/Kabupaten wajib diisi'),
  province: z.string().min(1, 'Provinsi wajib diisi'),
  postalCode: z.string().optional(),
  
  quranAbility: z.string().optional(),
  memorizedJuz: z.string().optional(),
  
  notes: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function NewRegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const { data: periods } = useRegistrationPeriods({ isActive: true });
  const { data: units } = useUnits();
  const createMutation = useCreateRegistration();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      periodId: '',
      unitId: '',
      fullName: '',
      nickname: '',
      gender: undefined,
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
      notes: '',
    },
  });

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          if (key === 'memorizedJuz' || key === 'graduationYear') {
            formData.append(key, value ? String(parseInt(value)) : '');
          } else {
            formData.append(key, String(value));
          }
        }
      });

      await createMutation.mutateAsync(formData);
      toast.success('Pendaftaran berhasil disimpan');
      router.push('/psb');
    } catch {
      toast.error('Gagal menyimpan pendaftaran');
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(step);
    const isValid = await form.trigger(fieldsToValidate as (keyof RegistrationFormData)[]);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const getFieldsForStep = (stepNumber: number): string[] => {
    switch (stepNumber) {
      case 1:
        return ['periodId', 'unitId', 'fullName', 'gender', 'birthPlace', 'birthDate'];
      case 2:
        return ['fatherName', 'motherName'];
      case 3:
        return ['address', 'village', 'district', 'city', 'province'];
      case 4:
        return [];
      default:
        return [];
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/psb">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Pendaftaran Santri Baru</h1>
            <p className="text-muted-foreground">
              Langkah {step} dari {totalSteps}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i + 1 <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Step 1: Data Pribadi */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Data Pribadi</CardTitle>
                  <CardDescription>
                    Informasi dasar calon santri
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="periodId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Periode Pendaftaran *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih periode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {periods?.map((period) => (
                                <SelectItem key={period.id} value={period.id}>
                                  {period.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unitId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Tujuan *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {units?.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id}>
                                  {unit.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama lengkap sesuai akta" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="nickname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Panggilan</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama panggilan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jenis Kelamin *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih jenis kelamin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="MALE">Laki-laki</SelectItem>
                              <SelectItem value="FEMALE">Perempuan</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="birthPlace"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tempat Lahir *</FormLabel>
                          <FormControl>
                            <Input placeholder="Kota tempat lahir" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tanggal Lahir *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="nationalId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIK</FormLabel>
                          <FormControl>
                            <Input placeholder="16 digit NIK" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="familyCardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>No. Kartu Keluarga</FormLabel>
                          <FormControl>
                            <Input placeholder="16 digit No. KK" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Data Orang Tua */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Data Orang Tua</CardTitle>
                  <CardDescription>
                    Informasi ayah dan ibu calon santri
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Data Ayah */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Data Ayah</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="fatherName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nama Ayah *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nama lengkap ayah" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="fatherOccupation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pekerjaan Ayah</FormLabel>
                            <FormControl>
                              <Input placeholder="Pekerjaan" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="fatherPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>No. HP Ayah</FormLabel>
                            <FormControl>
                              <Input placeholder="08xxxxxxxxxx" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="fatherEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Ayah</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Data Ibu */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Data Ibu</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="motherName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nama Ibu *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nama lengkap ibu" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="motherOccupation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pekerjaan Ibu</FormLabel>
                            <FormControl>
                              <Input placeholder="Pekerjaan" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="motherPhone"
                      render={({ field }) => (
                        <FormItem className="md:w-1/2">
                          <FormLabel>No. HP Ibu</FormLabel>
                          <FormControl>
                            <Input placeholder="08xxxxxxxxxx" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Alamat */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Alamat</CardTitle>
                  <CardDescription>
                    Alamat tempat tinggal calon santri
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alamat Lengkap *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Nama jalan, nomor rumah, RT/RW"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="village"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Desa/Kelurahan *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama desa/kelurahan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kecamatan *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama kecamatan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kota/Kabupaten *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama kota/kabupaten" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="province"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provinsi *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama provinsi" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem className="md:w-1/2">
                        <FormLabel>Kode Pos</FormLabel>
                        <FormControl>
                          <Input placeholder="5 digit kode pos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 4: Pendidikan & Kemampuan */}
            {step === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pendidikan & Kemampuan</CardTitle>
                  <CardDescription>
                    Riwayat pendidikan dan kemampuan Al-Quran
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Pendidikan */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Pendidikan Sebelumnya</h3>
                    <FormField
                      control={form.control}
                      name="previousSchool"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Sekolah Asal</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama sekolah" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="previousSchoolAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alamat Sekolah</FormLabel>
                            <FormControl>
                              <Input placeholder="Alamat sekolah" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="graduationYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tahun Lulus</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="2024" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Kemampuan Al-Quran */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Kemampuan Al-Quran</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="quranAbility"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kemampuan Baca</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih kemampuan" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="BELUM_BISA">Belum bisa</SelectItem>
                                <SelectItem value="IQRA">Iqra</SelectItem>
                                <SelectItem value="LANCAR">Lancar</SelectItem>
                                <SelectItem value="TARTIL">Tartil</SelectItem>
                                <SelectItem value="TAHFIDZ">Tahfidz</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="memorizedJuz"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hafalan (Juz)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                max={30}
                                placeholder="0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Catatan */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catatan Tambahan</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Informasi tambahan yang perlu disampaikan"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={step === 1}
              >
                Sebelumnya
              </Button>
              {step < totalSteps ? (
                <Button type="button" onClick={nextStep}>
                  Selanjutnya
                </Button>
              ) : (
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Pendaftaran
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </MainLayout>
  );
}
