import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnifiedRaportService } from './unified-raport.service';
import { prisma } from '@/lib/prisma';
import RaportMerdekaService from './raport-merdeka.service';
import * as raporPesantrenService from '../rapor-pesantren/rapor-pesantren.service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    student: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('./raport-merdeka.service', () => {
  return {
    default: {
      generateRaportMerdeka: vi.fn(),
    },
  };
});

vi.mock('../rapor-pesantren/rapor-pesantren.service', () => ({
  generateRaporPesantren: vi.fn(),
}));

describe('UnifiedRaportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateUnifiedRaport', () => {
    it('should throw an error if student is not found', async () => {
      vi.mocked(prisma.student.findUnique).mockResolvedValue(null);

      await expect(
        UnifiedRaportService.generateUnifiedRaport('stud-1', 'year-1', 1)
      ).rejects.toThrow('Siswa tidak ditemukan');
    });

    it('should throw an error if enrollment data is missing', async () => {
      vi.mocked(prisma.student.findUnique).mockResolvedValue({
        id: 'stud-1',
        enrollments: [], // Empty enrollments
        user: { name: 'John Doe' },
        unit: { id: 'unit-1', name: 'SD IT', address: 'Jalan', logoUrl: 'url' },
      } as any);

      await expect(
        UnifiedRaportService.generateUnifiedRaport('stud-1', 'year-1', 1)
      ).rejects.toThrow('Data enrollment tidak ditemukan');
    });

    it('should successfully combine Raport Merdeka and Rapor Pesantren', async () => {
      // Setup Database Mock
      vi.mocked(prisma.student.findUnique).mockResolvedValue({
        id: 'stud-1',
        nis: '12345',
        nisn: '987654321',
        unitId: 'unit-sd',
        user: { name: 'Ahmad Santri' },
        unit: { id: 'unit-sd', name: 'SD IT Al-Quran', address: 'Jl. Pesantren', logoUrl: '/logo.png' },
        enrollments: [
          {
            class: {
              name: 'Kelas 1A',
              level: 1,
              homeroomTeacher: { user: { name: 'Ust. Fulan' } },
            },
          },
        ],
      } as any);

      // Setup Raport Merdeka Mock
      const mockRaportMerdeka = {
        tahunAjaran: { tahun: '2025/2026' },
        intrakurikuler: [{ mataPelajaran: 'Matematika', nilaiAkhir: 85 }],
        projekP5: [{ tema: 'Kearifan Lokal', predikat: 'Berkembang' }],
        ekstrakurikuler: [{ nama: 'Pramuka', predikat: 'Sangat Baik' }],
        kehadiran: { sakit: 1, izin: 0, tanpaKeterangan: 0 },
        catatanWaliKelas: 'Pertahankan prestasinya',
        catatanKepalaSekolah: 'Bagus',
      };
      vi.mocked(RaportMerdekaService.generateRaportMerdeka).mockResolvedValue(mockRaportMerdeka as any);

      // Setup Rapor Pesantren Mock
      const mockRaporPesantren = {
        tahfidz: { totalHafalan: 30, nilaiMurojaah: 'Mumtaz' },
        ibadah: { sholatJamaah: 'Sangat Baik' },
        akhlak: { kedisiplinan: 'Baik' },
        kitabProgress: [],
        muhadhoroh: null,
        muhadatsah: null,
        overallGrade: 'A',
        overallScore: 90,
        notes: 'Sangat rajin dhuha',
        musyrifNotes: 'Kamar selalu rapi',
      };
      vi.mocked(raporPesantrenService.generateRaporPesantren).mockResolvedValue(mockRaporPesantren as any);

      // Execute Test
      const result = await UnifiedRaportService.generateUnifiedRaport('stud-1', 'year-1', 1);

      // Assertions Structure
      expect(result.student.name).toBe('Ahmad Santri');
      expect(result.school.name).toBe('SD IT Al-Quran');
      expect(result.academic.intrakurikuler).toEqual(mockRaportMerdeka.intrakurikuler);
      expect(result.academic.p5).toEqual(mockRaportMerdeka.projekP5);
      expect(result.islamic.tahfidz).toEqual(mockRaporPesantren.tahfidz);
      expect(result.remarks.academic).toBe('Pertahankan prestasinya');
      expect(result.signatures.homeroomTeacher).toBe('Ust. Fulan');
      
      // Assure backend parallel execution occurred
      expect(RaportMerdekaService.generateRaportMerdeka).toHaveBeenCalledWith('stud-1', 'year-1', 1);
      expect(raporPesantrenService.generateRaporPesantren).toHaveBeenCalledWith({
        studentId: 'stud-1',
        academicYearId: 'year-1',
        semester: 1,
        unitId: 'unit-sd',
      });
    });
  });
});
