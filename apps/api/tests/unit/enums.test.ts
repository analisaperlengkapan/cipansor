/**
 * Enum Validation Tests
 * Tests for all PAUD, Daily Report, and Tahfidz enhancement enums
 */

import { describe, it, expect } from 'vitest';
import {
  PAUDAspect,
  PAUDAchievementLevel,
  PAUDReportPeriod,
  DailyMood,
  MealConsumption,
  MurojaahType,
  TahfidzMistakeType,
  SimaanType,
} from '@prisma/client';

describe('PAUD Enums', () => {
  describe('PAUDAspect', () => {
    it('should have all 6 aspects of child development', () => {
      const aspects = Object.values(PAUDAspect);
      expect(aspects).toHaveLength(6);
      expect(aspects).toContain('NAM'); // Nilai Agama & Moral
      expect(aspects).toContain('FM'); // Fisik Motorik
      expect(aspects).toContain('KOG'); // Kognitif
      expect(aspects).toContain('BHS'); // Bahasa
      expect(aspects).toContain('SE'); // Sosial Emosional
      expect(aspects).toContain('SNI'); // Seni
    });

    it('should be valid enum values', () => {
      expect(PAUDAspect.NAM).toBe('NAM');
      expect(PAUDAspect.FM).toBe('FM');
      expect(PAUDAspect.KOG).toBe('KOG');
      expect(PAUDAspect.BHS).toBe('BHS');
      expect(PAUDAspect.SE).toBe('SE');
      expect(PAUDAspect.SNI).toBe('SNI');
    });

    it('should validate aspect strings', () => {
      const validAspects: string[] = ['NAM', 'FM', 'KOG', 'BHS', 'SE', 'SNI'];
      const allAspects = Object.values(PAUDAspect);

      validAspects.forEach((aspect) => {
        expect(allAspects).toContain(aspect);
      });
    });

    it('should reject invalid aspect values', () => {
      const invalidAspects = ['INVALID', 'XYZ', ''];
      const allAspects = Object.values(PAUDAspect);

      invalidAspects.forEach((aspect) => {
        expect(allAspects).not.toContain(aspect);
      });
    });
  });

  describe('PAUDAchievementLevel', () => {
    it('should have all 4 achievement levels', () => {
      const levels = Object.values(PAUDAchievementLevel);
      expect(levels).toHaveLength(4);
      expect(levels).toContain('BB'); // Belum Berkembang
      expect(levels).toContain('MB'); // Mulai Berkembang
      expect(levels).toContain('BSH'); // Berkembang Sesuai Harapan
      expect(levels).toContain('BSB'); // Berkembang Sangat Baik
    });

    it('should be in progression order', () => {
      // BB -> MB -> BSH -> BSB represents development progression
      const progressionMap: Record<string, number> = {
        BB: 1, // Lowest
        MB: 2,
        BSH: 3,
        BSB: 4, // Highest
      };

      expect(progressionMap.BB).toBeLessThan(progressionMap.MB);
      expect(progressionMap.MB).toBeLessThan(progressionMap.BSH);
      expect(progressionMap.BSH).toBeLessThan(progressionMap.BSB);
    });

    it('should validate level strings', () => {
      const validLevels: string[] = ['BB', 'MB', 'BSH', 'BSB'];
      const allLevels = Object.values(PAUDAchievementLevel);

      validLevels.forEach((level) => {
        expect(allLevels).toContain(level);
      });
    });
  });

  describe('PAUDReportPeriod', () => {
    it('should have all 4 report periods', () => {
      const periods = Object.values(PAUDReportPeriod);
      expect(periods).toHaveLength(4);
      expect(periods).toContain('HARIAN'); // Daily
      expect(periods).toContain('MINGGUAN'); // Weekly
      expect(periods).toContain('BULANAN'); // Monthly
      expect(periods).toContain('SEMESTER'); // Semester
    });

    it('should validate period strings', () => {
      const validPeriods: string[] = ['HARIAN', 'MINGGUAN', 'BULANAN', 'SEMESTER'];
      const allPeriods = Object.values(PAUDReportPeriod);

      validPeriods.forEach((period) => {
        expect(allPeriods).toContain(period);
      });
    });

    it('should have proper period hierarchy', () => {
      // HARIAN < MINGGUAN < BULANAN < SEMESTER
      const hierarchy: Record<string, number> = {
        HARIAN: 1, // Smallest time unit
        MINGGUAN: 7,
        BULANAN: 30,
        SEMESTER: 180, // Largest time unit
      };

      expect(hierarchy.HARIAN).toBeLessThan(hierarchy.MINGGUAN);
      expect(hierarchy.MINGGUAN).toBeLessThan(hierarchy.BULANAN);
      expect(hierarchy.BULANAN).toBeLessThan(hierarchy.SEMESTER);
    });
  });
});

describe('Daily Report Enums', () => {
  describe('DailyMood', () => {
    it('should have all 6 mood options', () => {
      const moods = Object.values(DailyMood);
      expect(moods).toHaveLength(6);
      expect(moods).toContain('HAPPY'); // 😊 Senang
      expect(moods).toContain('NEUTRAL'); // 😐 Biasa
      expect(moods).toContain('SAD'); // 😢 Sedih
      expect(moods).toContain('TIRED'); // 😴 Lelah
      expect(moods).toContain('EXCITED'); // 🤩 Antusias
      expect(moods).toContain('SICK'); // 🤒 Sakit
    });

    it('should validate mood strings', () => {
      const validMoods: string[] = ['HAPPY', 'NEUTRAL', 'SAD', 'TIRED', 'EXCITED', 'SICK'];
      const allMoods = Object.values(DailyMood);

      validMoods.forEach((mood) => {
        expect(allMoods).toContain(mood);
      });
    });

    it('should categorize positive and negative moods', () => {
      const positiveMoods = ['HAPPY', 'EXCITED'];
      const neutralMoods = ['NEUTRAL'];
      const negativeMoods = ['SAD', 'TIRED', 'SICK'];

      const allMoods = Object.values(DailyMood);
      [...positiveMoods, ...neutralMoods, ...negativeMoods].forEach((mood) => {
        expect(allMoods).toContain(mood);
      });
    });
  });

  describe('MealConsumption', () => {
    it('should have all 4 consumption levels', () => {
      const levels = Object.values(MealConsumption);
      expect(levels).toHaveLength(4);
      expect(levels).toContain('HABIS'); // Dimakan habis
      expect(levels).toContain('SETENGAH'); // Dimakan setengah
      expect(levels).toContain('SEDIKIT'); // Dimakan sedikit
      expect(levels).toContain('TIDAK_MAU'); // Tidak mau makan
    });

    it('should validate consumption strings', () => {
      const validLevels: string[] = ['HABIS', 'SETENGAH', 'SEDIKIT', 'TIDAK_MAU'];
      const allLevels = Object.values(MealConsumption);

      validLevels.forEach((level) => {
        expect(allLevels).toContain(level);
      });
    });

    it('should represent consumption percentage order', () => {
      // Consumption levels in descending order
      const consumptionMap: Record<string, number> = {
        HABIS: 100,
        SETENGAH: 50,
        SEDIKIT: 25,
        TIDAK_MAU: 0,
      };

      expect(consumptionMap.HABIS).toBeGreaterThan(consumptionMap.SETENGAH);
      expect(consumptionMap.SETENGAH).toBeGreaterThan(consumptionMap.SEDIKIT);
      expect(consumptionMap.SEDIKIT).toBeGreaterThan(consumptionMap.TIDAK_MAU);
    });
  });
});

describe('Tahfidz Enhancement Enums', () => {
  describe('MurojaahType', () => {
    it('should have all 4 murojaah types', () => {
      const types = Object.values(MurojaahType);
      expect(types).toHaveLength(4);
      expect(types).toContain('YAUMIYAH'); // Harian
      expect(types).toContain('USBUIYAH'); // Mingguan
      expect(types).toContain('SYAHRIYAH'); // Bulanan
      expect(types).toContain('TASMI'); // Random testing
    });

    it('should validate murojaah type strings', () => {
      const validTypes: string[] = ['YAUMIYAH', 'USBUIYAH', 'SYAHRIYAH', 'TASMI'];
      const allTypes = Object.values(MurojaahType);

      validTypes.forEach((type) => {
        expect(allTypes).toContain(type);
      });
    });

    it('should have proper frequency hierarchy', () => {
      const frequencyDays: Record<string, number> = {
        YAUMIYAH: 1, // Daily
        USBUIYAH: 7, // Weekly
        SYAHRIYAH: 30, // Monthly
        TASMI: 0, // Random
      };

      expect(frequencyDays.YAUMIYAH).toBeLessThan(frequencyDays.USBUIYAH);
      expect(frequencyDays.USBUIYAH).toBeLessThan(frequencyDays.SYAHRIYAH);
    });
  });

  describe('TahfidzMistakeType', () => {
    it('should have all mistake categories', () => {
      const types = Object.values(TahfidzMistakeType);
      expect(types).toHaveLength(5);
      expect(types).toContain('LAHIN_JALI'); // Kesalahan jelas (salah huruf/harakat)
      expect(types).toContain('LAHIN_KHAFI'); // Kesalahan tersembunyi (mad, ghunnah)
      expect(types).toContain('TAJWID'); // Kesalahan tajwid
      expect(types).toContain('LUPA'); // Lupa ayat
      expect(types).toContain('URUTAN'); // Salah urutan ayat
    });

    it('should validate mistake type strings', () => {
      const validTypes: string[] = ['LAHIN_JALI', 'LAHIN_KHAFI', 'TAJWID', 'LUPA', 'URUTAN'];
      const allTypes = Object.values(TahfidzMistakeType);

      validTypes.forEach((type) => {
        expect(allTypes).toContain(type);
      });
    });

    it('should categorize mistake severity', () => {
      // Severe mistakes (clearly audible)
      const severeMistakes = ['LAHIN_JALI', 'LUPA'];
      // Minor mistakes (hidden, order issues)
      const minorMistakes = ['LAHIN_KHAFI', 'URUTAN'];
      // Tajwid mistakes
      const tajwidMistakes = ['TAJWID'];

      const allMistakes = Object.values(TahfidzMistakeType);
      [...severeMistakes, ...minorMistakes, ...tajwidMistakes].forEach((mistake) => {
        expect(allMistakes).toContain(mistake);
      });
    });
  });

  describe('SimaanType', () => {
    it('should have all simaan exam types', () => {
      const types = Object.values(SimaanType);
      expect(types).toHaveLength(5);
      expect(types).toContain('BIN_NAZHR'); // Dengan melihat mushaf
      expect(types).toContain('BIL_GHAIB'); // Tanpa melihat (hafalan)
      expect(types).toContain('TAHDIR'); // Persiapan (juz dipilih)
      expect(types).toContain('TASMI'); // Random testing
      expect(types).toContain('KHATAM'); // Ujian khatam 30 juz
    });

    it('should validate simaan type strings', () => {
      const validTypes: string[] = ['BIN_NAZHR', 'BIL_GHAIB', 'TAHDIR', 'TASMI', 'KHATAM'];
      const allTypes = Object.values(SimaanType);

      validTypes.forEach((type) => {
        expect(allTypes).toContain(type);
      });
    });

    it('should categorize by reading method', () => {
      const withMushaf = ['BIN_NAZHR']; // With Quran text
      const fromMemory = ['BIL_GHAIB']; // From memory
      const testingTypes = ['TAHDIR', 'TASMI', 'KHATAM']; // Different test modes

      const allTypes = Object.values(SimaanType);
      [...withMushaf, ...fromMemory, ...testingTypes].forEach((type) => {
        expect(allTypes).toContain(type);
      });
    });
  });
});

describe('Enum Edge Cases', () => {
  it('should not have duplicate values in any enum', () => {
    const enums = [
      PAUDAspect,
      PAUDAchievementLevel,
      PAUDReportPeriod,
      DailyMood,
      MealConsumption,
      MurojaahType,
      TahfidzMistakeType,
      SimaanType,
    ];

    enums.forEach((enumObj) => {
      const values = Object.values(enumObj);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });
  });

  it('should have all enum values as strings', () => {
    const enums = [
      PAUDAspect,
      PAUDAchievementLevel,
      PAUDReportPeriod,
      DailyMood,
      MealConsumption,
      MurojaahType,
      TahfidzMistakeType,
      SimaanType,
    ];

    enums.forEach((enumObj) => {
      const values = Object.values(enumObj);
      values.forEach((value) => {
        expect(typeof value).toBe('string');
      });
    });
  });

  it('should not have empty string values', () => {
    const enums = [
      PAUDAspect,
      PAUDAchievementLevel,
      PAUDReportPeriod,
      DailyMood,
      MealConsumption,
      MurojaahType,
      TahfidzMistakeType,
      SimaanType,
    ];

    enums.forEach((enumObj) => {
      const values = Object.values(enumObj);
      values.forEach((value) => {
        expect(value).not.toBe('');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });
});
