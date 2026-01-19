/**
 * Helper data for Quran mapping
 * Maps Surah Number to array of Juz Numbers it belongs to.
 */

export const QURAN_SURAH_JUZ_MAPPING: Record<number, number[]> = {
  // Surahs spanning multiple Juz
  2: [1, 2, 3], // Al-Baqarah
  3: [3, 4],    // Ali 'Imran
  4: [4, 5, 6], // An-Nisa'
  5: [6, 7],    // Al-Ma'idah
  6: [7, 8],    // Al-An'am
  7: [8, 9],    // Al-A'raf
  8: [9, 10],   // Al-Anfal
  9: [10, 11],  // At-Taubah
  11: [11, 12], // Hud
  12: [12, 13], // Yusuf
  18: [15, 16], // Al-Kahf
  25: [18, 19], // Al-Furqan
  27: [19, 20], // An-Naml
  29: [20, 21], // Al-Ankabut
  33: [21, 22], // Al-Ahzab
  36: [22, 23], // Ya Sin
  39: [23, 24], // Az-Zumar
  41: [24, 25], // Fussilat
  51: [26, 27], // Az-Zariyat

  // Single Juz Surahs (Explicit mapping for clarity and fallback)
  1: [1],
  10: [11],
  13: [13],
  14: [13],
  15: [14],
  16: [14],
  17: [15],
  19: [16],
  20: [16],
  21: [17],
  22: [17],
  23: [18],
  24: [18],
  26: [19],
  28: [20],
  30: [21],
  31: [21],
  32: [21],
  34: [22],
  35: [22],
  37: [23],
  38: [23],
  40: [24],
  42: [25],
  43: [25],
  44: [25],
  45: [25],
  46: [26],
  47: [26],
  48: [26],
  49: [26],
  50: [26],
  52: [27],
  53: [27],
  54: [27],
  55: [27],
  56: [27],
  57: [27],

  // Grouped mappings for remaining
  // Juz 28
  58: [28], 59: [28], 60: [28], 61: [28], 62: [28], 63: [28], 64: [28], 65: [28], 66: [28],
  // Juz 29
  67: [29], 68: [29], 69: [29], 70: [29], 71: [29], 72: [29], 73: [29], 74: [29], 75: [29], 76: [29], 77: [29],
  // Juz 30 (Surah 78 to 114)
  ...Array.from({ length: 114 - 78 + 1 }, (_, i) => i + 78).reduce((acc, curr) => ({ ...acc, [curr]: [30] }), {}),
};

export function getJuzForSurah(surahNumber: number): number[] {
  return QURAN_SURAH_JUZ_MAPPING[surahNumber] || [getStartJuz(surahNumber)];
}

/**
 * Fallback to estimate start Juz if not in explicit map (though map should cover all)
 */
function getStartJuz(surahNumber: number): number {
  if (surahNumber >= 78) return 30;
  if (surahNumber >= 67) return 29;
  if (surahNumber >= 58) return 28;
  // Fallback to approximate logic or just return 1 if unknown in this simple helper
  // (We aim to have full coverage in the map)
  return 1;
}
