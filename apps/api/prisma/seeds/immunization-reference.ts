import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ImmunizationSchedule {
  vaccineName: string;
  vaccineCode: string;
  doseNumber: number;
  ageMonthsMin: number; // Minimum age in months
  ageMonthsMax: number; // Maximum age in months
  description: string;
}

// Indonesian National Immunization Program (Program Imunisasi Nasional)
// Based on IDAI (Ikatan Dokter Anak Indonesia) recommendations
const immunizationSchedules: ImmunizationSchedule[] = [
  // Hepatitis B
  { vaccineName: 'Hepatitis B', vaccineCode: 'HB-0', doseNumber: 0, ageMonthsMin: 0, ageMonthsMax: 0, description: 'Diberikan dalam 24 jam setelah lahir' },
  { vaccineName: 'Hepatitis B', vaccineCode: 'HB-1', doseNumber: 1, ageMonthsMin: 2, ageMonthsMax: 2, description: 'Diberikan bersamaan dengan DPT-HB-Hib 1' },
  { vaccineName: 'Hepatitis B', vaccineCode: 'HB-2', doseNumber: 2, ageMonthsMin: 3, ageMonthsMax: 3, description: 'Diberikan bersamaan dengan DPT-HB-Hib 2' },
  { vaccineName: 'Hepatitis B', vaccineCode: 'HB-3', doseNumber: 3, ageMonthsMin: 4, ageMonthsMax: 4, description: 'Diberikan bersamaan dengan DPT-HB-Hib 3' },

  // BCG (Bacille Calmette-Guérin) - Tuberculosis
  { vaccineName: 'BCG', vaccineCode: 'BCG', doseNumber: 1, ageMonthsMin: 0, ageMonthsMax: 1, description: 'Diberikan pada usia 0-1 bulan' },

  // Polio
  { vaccineName: 'Polio (OPV)', vaccineCode: 'OPV-0', doseNumber: 0, ageMonthsMin: 0, ageMonthsMax: 0, description: 'Diberikan saat lahir atau sebelum pulang dari RS' },
  { vaccineName: 'Polio (OPV)', vaccineCode: 'OPV-1', doseNumber: 1, ageMonthsMin: 2, ageMonthsMax: 2, description: 'Diberikan bersamaan dengan DPT-HB-Hib 1' },
  { vaccineName: 'Polio (OPV)', vaccineCode: 'OPV-2', doseNumber: 2, ageMonthsMin: 3, ageMonthsMax: 3, description: 'Diberikan bersamaan dengan DPT-HB-Hib 2' },
  { vaccineName: 'Polio (OPV)', vaccineCode: 'OPV-3', doseNumber: 3, ageMonthsMin: 4, ageMonthsMax: 4, description: 'Diberikan bersamaan dengan DPT-HB-Hib 3' },
  { vaccineName: 'Polio (IPV)', vaccineCode: 'IPV', doseNumber: 1, ageMonthsMin: 4, ageMonthsMax: 4, description: 'Diberikan bersamaan dengan DPT-HB-Hib 3' },

  // DPT-HB-Hib (Pentavalent - Difteri, Pertusis, Tetanus, Hepatitis B, Haemophilus influenzae type b)
  { vaccineName: 'DPT-HB-Hib', vaccineCode: 'DPT-HB-Hib-1', doseNumber: 1, ageMonthsMin: 2, ageMonthsMax: 2, description: 'Diberikan pada usia 2 bulan' },
  { vaccineName: 'DPT-HB-Hib', vaccineCode: 'DPT-HB-Hib-2', doseNumber: 2, ageMonthsMin: 3, ageMonthsMax: 3, description: 'Diberikan pada usia 3 bulan' },
  { vaccineName: 'DPT-HB-Hib', vaccineCode: 'DPT-HB-Hib-3', doseNumber: 3, ageMonthsMin: 4, ageMonthsMax: 4, description: 'Diberikan pada usia 4 bulan' },
  { vaccineName: 'DPT-HB-Hib (Booster)', vaccineCode: 'DPT-HB-Hib-B', doseNumber: 4, ageMonthsMin: 18, ageMonthsMax: 18, description: 'Booster diberikan pada usia 18 bulan' },

  // Campak / MR (Measles-Rubella)
  { vaccineName: 'Campak/MR', vaccineCode: 'MR-1', doseNumber: 1, ageMonthsMin: 9, ageMonthsMax: 9, description: 'Diberikan pada usia 9 bulan' },
  { vaccineName: 'Campak/MR', vaccineCode: 'MR-2', doseNumber: 2, ageMonthsMin: 18, ageMonthsMax: 18, description: 'Diberikan pada usia 18 bulan' },

  // PCV (Pneumococcal Conjugate Vaccine)
  { vaccineName: 'PCV', vaccineCode: 'PCV-1', doseNumber: 1, ageMonthsMin: 2, ageMonthsMax: 2, description: 'Diberikan pada usia 2 bulan' },
  { vaccineName: 'PCV', vaccineCode: 'PCV-2', doseNumber: 2, ageMonthsMin: 4, ageMonthsMax: 4, description: 'Diberikan pada usia 4 bulan' },
  { vaccineName: 'PCV', vaccineCode: 'PCV-3', doseNumber: 3, ageMonthsMin: 6, ageMonthsMax: 6, description: 'Diberikan pada usia 6 bulan' },
  { vaccineName: 'PCV (Booster)', vaccineCode: 'PCV-B', doseNumber: 4, ageMonthsMin: 12, ageMonthsMax: 15, description: 'Booster diberikan pada usia 12-15 bulan' },

  // Rotavirus
  { vaccineName: 'Rotavirus', vaccineCode: 'RV-1', doseNumber: 1, ageMonthsMin: 2, ageMonthsMax: 2, description: 'Diberikan pada usia 2 bulan' },
  { vaccineName: 'Rotavirus', vaccineCode: 'RV-2', doseNumber: 2, ageMonthsMin: 4, ageMonthsMax: 4, description: 'Diberikan pada usia 4 bulan' },
  { vaccineName: 'Rotavirus', vaccineCode: 'RV-3', doseNumber: 3, ageMonthsMin: 6, ageMonthsMax: 6, description: 'Diberikan pada usia 6 bulan (jika menggunakan Rotateq)' },

  // Influenza (yearly)
  { vaccineName: 'Influenza', vaccineCode: 'FLU-1', doseNumber: 1, ageMonthsMin: 6, ageMonthsMax: 6, description: 'Diberikan pertama kali pada usia 6 bulan' },
  { vaccineName: 'Influenza', vaccineCode: 'FLU-2', doseNumber: 2, ageMonthsMin: 7, ageMonthsMax: 7, description: 'Diberikan 1 bulan setelah dosis pertama' },
  { vaccineName: 'Influenza (Tahunan)', vaccineCode: 'FLU-Y', doseNumber: 3, ageMonthsMin: 12, ageMonthsMax: 72, description: 'Diulang setiap tahun' },

  // JE (Japanese Encephalitis) - untuk daerah endemis
  { vaccineName: 'Japanese Encephalitis', vaccineCode: 'JE-1', doseNumber: 1, ageMonthsMin: 9, ageMonthsMax: 9, description: 'Diberikan pada usia 9 bulan (daerah endemis)' },
  { vaccineName: 'Japanese Encephalitis', vaccineCode: 'JE-2', doseNumber: 2, ageMonthsMin: 21, ageMonthsMax: 24, description: 'Booster diberikan 12-24 bulan setelah dosis pertama' },

  // Varicella (Cacar Air)
  { vaccineName: 'Varicella', vaccineCode: 'VAR-1', doseNumber: 1, ageMonthsMin: 12, ageMonthsMax: 18, description: 'Diberikan pada usia 12-18 bulan' },
  { vaccineName: 'Varicella', vaccineCode: 'VAR-2', doseNumber: 2, ageMonthsMin: 48, ageMonthsMax: 72, description: 'Booster diberikan pada usia 4-6 tahun' },

  // Hepatitis A
  { vaccineName: 'Hepatitis A', vaccineCode: 'HA-1', doseNumber: 1, ageMonthsMin: 12, ageMonthsMax: 24, description: 'Diberikan pada usia 12-24 bulan' },
  { vaccineName: 'Hepatitis A', vaccineCode: 'HA-2', doseNumber: 2, ageMonthsMin: 18, ageMonthsMax: 36, description: 'Diberikan 6-12 bulan setelah dosis pertama' },

  // Typhoid
  { vaccineName: 'Typhoid', vaccineCode: 'TYP-1', doseNumber: 1, ageMonthsMin: 24, ageMonthsMax: 24, description: 'Diberikan mulai usia 2 tahun' },
  { vaccineName: 'Typhoid (Ulangan)', vaccineCode: 'TYP-R', doseNumber: 2, ageMonthsMin: 60, ageMonthsMax: 60, description: 'Diulang setiap 3 tahun' },

  // HPV (untuk anak perempuan)
  { vaccineName: 'HPV', vaccineCode: 'HPV-1', doseNumber: 1, ageMonthsMin: 108, ageMonthsMax: 132, description: 'Diberikan pada usia 9-11 tahun' },
  { vaccineName: 'HPV', vaccineCode: 'HPV-2', doseNumber: 2, ageMonthsMin: 114, ageMonthsMax: 144, description: 'Diberikan 6-12 bulan setelah dosis pertama' },

  // Td/Tdap (Tetanus, Diphtheria, acellular Pertussis) - School age
  { vaccineName: 'DT (Difteri-Tetanus)', vaccineCode: 'DT-SD', doseNumber: 1, ageMonthsMin: 72, ageMonthsMax: 84, description: 'Diberikan pada kelas 1 SD (usia 6-7 tahun)' },
  { vaccineName: 'Td (Tetanus-difteri)', vaccineCode: 'Td-SD', doseNumber: 2, ageMonthsMin: 84, ageMonthsMax: 96, description: 'Diberikan pada kelas 2 SD (usia 7-8 tahun)' },
  { vaccineName: 'Td (Tetanus-difteri)', vaccineCode: 'Td-5', doseNumber: 3, ageMonthsMin: 132, ageMonthsMax: 144, description: 'Diberikan pada kelas 5 SD (usia 11-12 tahun)' },
];

// Store reference as JSON in Setting or separate reference table
export async function seedImmunizationReference() {
  console.log('🌱 Seeding Immunization Reference Data...');

  // Store immunization schedule reference in settings
  const existingSetting = await prisma.setting.findFirst({
    where: { key: 'immunization_schedule_reference' }
  });

  const scheduleData = {
    version: '2024',
    source: 'IDAI (Ikatan Dokter Anak Indonesia)',
    lastUpdated: new Date().toISOString(),
    schedules: immunizationSchedules,
    notes: [
      'Jadwal imunisasi mengacu pada rekomendasi IDAI 2023',
      'Interval minimal antar dosis vaksin sejenis adalah 4 minggu',
      'Beberapa vaksin dapat diberikan bersamaan di lokasi berbeda',
      'Konsultasikan dengan dokter untuk imunisasi kejar (catch-up)'
    ]
  };

  if (existingSetting) {
    await prisma.setting.update({
      where: { id: existingSetting.id },
      data: {
        value: scheduleData,
        updatedAt: new Date()
      }
    });
    console.log('✅ Updated Immunization Reference Data');
  } else {
    // Need to associate with a unit, using first unit found
    const firstUnit = await prisma.unit.findFirst();
    if (firstUnit) {
      await prisma.setting.create({
        data: {
          unitId: firstUnit.id,
          key: 'immunization_schedule_reference',
          value: scheduleData
        }
      });
      console.log('✅ Created Immunization Reference Data');
    } else {
      console.log('⚠️ No unit found, skipping immunization reference seed');
    }
  }

  // Log summary
  const vaccineTypes = [...new Set(immunizationSchedules.map(s => s.vaccineName))];
  console.log(`   - Total vaccine types: ${vaccineTypes.length}`);
  console.log(`   - Total doses defined: ${immunizationSchedules.length}`);
}

// Helper function to get immunization schedule for a specific age
export function getImmunizationScheduleForAge(ageMonths: number): ImmunizationSchedule[] {
  return immunizationSchedules.filter(
    s => ageMonths >= s.ageMonthsMin && ageMonths <= s.ageMonthsMax
  );
}

// Helper function to get upcoming immunizations
export function getUpcomingImmunizations(ageMonths: number): ImmunizationSchedule[] {
  return immunizationSchedules.filter(
    s => s.ageMonthsMin > ageMonths && s.ageMonthsMin <= ageMonths + 6
  ).sort((a, b) => a.ageMonthsMin - b.ageMonthsMin);
}

// Run if called directly
if (require.main === module) {
  seedImmunizationReference()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
