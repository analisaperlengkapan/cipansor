import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Data Wilayah Indonesia berdasarkan BPS (Badan Pusat Statistik)
 * 34 Provinsi dengan kode standar
 */
export const provinsiData = [
  { code: '11', name: 'ACEH' },
  { code: '12', name: 'SUMATERA UTARA' },
  { code: '13', name: 'SUMATERA BARAT' },
  { code: '14', name: 'RIAU' },
  { code: '15', name: 'JAMBI' },
  { code: '16', name: 'SUMATERA SELATAN' },
  { code: '17', name: 'BENGKULU' },
  { code: '18', name: 'LAMPUNG' },
  { code: '19', name: 'KEPULAUAN BANGKA BELITUNG' },
  { code: '21', name: 'KEPULAUAN RIAU' },
  { code: '31', name: 'DKI JAKARTA' },
  { code: '32', name: 'JAWA BARAT' },
  { code: '33', name: 'JAWA TENGAH' },
  { code: '34', name: 'DI YOGYAKARTA' },
  { code: '35', name: 'JAWA TIMUR' },
  { code: '36', name: 'BANTEN' },
  { code: '51', name: 'BALI' },
  { code: '52', name: 'NUSA TENGGARA BARAT' },
  { code: '53', name: 'NUSA TENGGARA TIMUR' },
  { code: '61', name: 'KALIMANTAN BARAT' },
  { code: '62', name: 'KALIMANTAN TENGAH' },
  { code: '63', name: 'KALIMANTAN SELATAN' },
  { code: '64', name: 'KALIMANTAN TIMUR' },
  { code: '65', name: 'KALIMANTAN UTARA' },
  { code: '71', name: 'SULAWESI UTARA' },
  { code: '72', name: 'SULAWESI TENGAH' },
  { code: '73', name: 'SULAWESI SELATAN' },
  { code: '74', name: 'SULAWESI TENGGARA' },
  { code: '75', name: 'GORONTALO' },
  { code: '76', name: 'SULAWESI BARAT' },
  { code: '81', name: 'MALUKU' },
  { code: '82', name: 'MALUKU UTARA' },
  { code: '91', name: 'PAPUA' },
  { code: '92', name: 'PAPUA BARAT' },
];

/**
 * Data Kabupaten/Kota sample untuk beberapa provinsi utama
 * Format: { code: 'XXXX', name: 'NAMA', provinceCode: 'XX' }
 */
export const regencyData = [
  // DKI Jakarta
  { code: '3101', name: 'KEPULAUAN SERIBU', provinceCode: '31' },
  { code: '3171', name: 'KOTA JAKARTA SELATAN', provinceCode: '31' },
  { code: '3172', name: 'KOTA JAKARTA TIMUR', provinceCode: '31' },
  { code: '3173', name: 'KOTA JAKARTA PUSAT', provinceCode: '31' },
  { code: '3174', name: 'KOTA JAKARTA BARAT', provinceCode: '31' },
  { code: '3175', name: 'KOTA JAKARTA UTARA', provinceCode: '31' },

  // Jawa Barat
  { code: '3201', name: 'KABUPATEN BOGOR', provinceCode: '32' },
  { code: '3202', name: 'KABUPATEN SUKABUMI', provinceCode: '32' },
  { code: '3203', name: 'KABUPATEN CIANJUR', provinceCode: '32' },
  { code: '3204', name: 'KABUPATEN BANDUNG', provinceCode: '32' },
  { code: '3205', name: 'KABUPATEN GARUT', provinceCode: '32' },
  { code: '3206', name: 'KABUPATEN TASIKMALAYA', provinceCode: '32' },
  { code: '3207', name: 'KABUPATEN CIAMIS', provinceCode: '32' },
  { code: '3208', name: 'KABUPATEN KUNINGAN', provinceCode: '32' },
  { code: '3209', name: 'KABUPATEN CIREBON', provinceCode: '32' },
  { code: '3210', name: 'KABUPATEN MAJALENGKA', provinceCode: '32' },
  { code: '3211', name: 'KABUPATEN SUMEDANG', provinceCode: '32' },
  { code: '3212', name: 'KABUPATEN INDRAMAYU', provinceCode: '32' },
  { code: '3213', name: 'KABUPATEN SUBANG', provinceCode: '32' },
  { code: '3214', name: 'KABUPATEN PURWAKARTA', provinceCode: '32' },
  { code: '3215', name: 'KABUPATEN KARAWANG', provinceCode: '32' },
  { code: '3216', name: 'KABUPATEN BEKASI', provinceCode: '32' },
  { code: '3217', name: 'KABUPATEN BANDUNG BARAT', provinceCode: '32' },
  { code: '3218', name: 'KABUPATEN PANGANDARAN', provinceCode: '32' },
  { code: '3271', name: 'KOTA BOGOR', provinceCode: '32' },
  { code: '3272', name: 'KOTA SUKABUMI', provinceCode: '32' },
  { code: '3273', name: 'KOTA BANDUNG', provinceCode: '32' },
  { code: '3274', name: 'KOTA CIREBON', provinceCode: '32' },
  { code: '3275', name: 'KOTA BEKASI', provinceCode: '32' },
  { code: '3276', name: 'KOTA DEPOK', provinceCode: '32' },
  { code: '3277', name: 'KOTA CIMAHI', provinceCode: '32' },
  { code: '3278', name: 'KOTA TASIKMALAYA', provinceCode: '32' },
  { code: '3279', name: 'KOTA BANJAR', provinceCode: '32' },

  // Jawa Tengah
  { code: '3301', name: 'KABUPATEN CILACAP', provinceCode: '33' },
  { code: '3302', name: 'KABUPATEN BANYUMAS', provinceCode: '33' },
  { code: '3303', name: 'KABUPATEN PURBALINGGA', provinceCode: '33' },
  { code: '3304', name: 'KABUPATEN BANJARNEGARA', provinceCode: '33' },
  { code: '3305', name: 'KABUPATEN KEBUMEN', provinceCode: '33' },
  { code: '3306', name: 'KABUPATEN PURWOREJO', provinceCode: '33' },
  { code: '3307', name: 'KABUPATEN WONOSOBO', provinceCode: '33' },
  { code: '3308', name: 'KABUPATEN MAGELANG', provinceCode: '33' },
  { code: '3309', name: 'KABUPATEN BOYOLALI', provinceCode: '33' },
  { code: '3310', name: 'KABUPATEN KLATEN', provinceCode: '33' },
  { code: '3311', name: 'KABUPATEN SUKOHARJO', provinceCode: '33' },
  { code: '3312', name: 'KABUPATEN WONOGIRI', provinceCode: '33' },
  { code: '3313', name: 'KABUPATEN KARANGANYAR', provinceCode: '33' },
  { code: '3314', name: 'KABUPATEN SRAGEN', provinceCode: '33' },
  { code: '3315', name: 'KABUPATEN GROBOGAN', provinceCode: '33' },
  { code: '3316', name: 'KABUPATEN BLORA', provinceCode: '33' },
  { code: '3317', name: 'KABUPATEN REMBANG', provinceCode: '33' },
  { code: '3318', name: 'KABUPATEN PATI', provinceCode: '33' },
  { code: '3319', name: 'KABUPATEN KUDUS', provinceCode: '33' },
  { code: '3320', name: 'KABUPATEN JEPARA', provinceCode: '33' },
  { code: '3321', name: 'KABUPATEN DEMAK', provinceCode: '33' },
  { code: '3322', name: 'KABUPATEN SEMARANG', provinceCode: '33' },
  { code: '3323', name: 'KABUPATEN TEMANGGUNG', provinceCode: '33' },
  { code: '3324', name: 'KABUPATEN KENDAL', provinceCode: '33' },
  { code: '3325', name: 'KABUPATEN BATANG', provinceCode: '33' },
  { code: '3326', name: 'KABUPATEN PEKALONGAN', provinceCode: '33' },
  { code: '3327', name: 'KABUPATEN PEMALANG', provinceCode: '33' },
  { code: '3328', name: 'KABUPATEN TEGAL', provinceCode: '33' },
  { code: '3329', name: 'KABUPATEN BREBES', provinceCode: '33' },
  { code: '3371', name: 'KOTA MAGELANG', provinceCode: '33' },
  { code: '3372', name: 'KOTA SURAKARTA', provinceCode: '33' },
  { code: '3373', name: 'KOTA SALATIGA', provinceCode: '33' },
  { code: '3374', name: 'KOTA SEMARANG', provinceCode: '33' },
  { code: '3375', name: 'KOTA PEKALONGAN', provinceCode: '33' },
  { code: '3376', name: 'KOTA TEGAL', provinceCode: '33' },

  // Jawa Timur
  { code: '3501', name: 'KABUPATEN PACITAN', provinceCode: '35' },
  { code: '3502', name: 'KABUPATEN PONOROGO', provinceCode: '35' },
  { code: '3503', name: 'KABUPATEN TRENGGALEK', provinceCode: '35' },
  { code: '3504', name: 'KABUPATEN TULUNGAGUNG', provinceCode: '35' },
  { code: '3505', name: 'KABUPATEN BLITAR', provinceCode: '35' },
  { code: '3506', name: 'KABUPATEN KEDIRI', provinceCode: '35' },
  { code: '3507', name: 'KABUPATEN MALANG', provinceCode: '35' },
  { code: '3508', name: 'KABUPATEN LUMAJANG', provinceCode: '35' },
  { code: '3509', name: 'KABUPATEN JEMBER', provinceCode: '35' },
  { code: '3510', name: 'KABUPATEN BANYUWANGI', provinceCode: '35' },
  { code: '3511', name: 'KABUPATEN BONDOWOSO', provinceCode: '35' },
  { code: '3512', name: 'KABUPATEN SITUBONDO', provinceCode: '35' },
  { code: '3513', name: 'KABUPATEN PROBOLINGGO', provinceCode: '35' },
  { code: '3514', name: 'KABUPATEN PASURUAN', provinceCode: '35' },
  { code: '3515', name: 'KABUPATEN SIDOARJO', provinceCode: '35' },
  { code: '3516', name: 'KABUPATEN MOJOKERTO', provinceCode: '35' },
  { code: '3517', name: 'KABUPATEN JOMBANG', provinceCode: '35' },
  { code: '3518', name: 'KABUPATEN NGANJUK', provinceCode: '35' },
  { code: '3519', name: 'KABUPATEN MADIUN', provinceCode: '35' },
  { code: '3520', name: 'KABUPATEN MAGETAN', provinceCode: '35' },
  { code: '3521', name: 'KABUPATEN NGAWI', provinceCode: '35' },
  { code: '3522', name: 'KABUPATEN BOJONEGORO', provinceCode: '35' },
  { code: '3523', name: 'KABUPATEN TUBAN', provinceCode: '35' },
  { code: '3524', name: 'KABUPATEN LAMONGAN', provinceCode: '35' },
  { code: '3525', name: 'KABUPATEN GRESIK', provinceCode: '35' },
  { code: '3526', name: 'KABUPATEN BANGKALAN', provinceCode: '35' },
  { code: '3527', name: 'KABUPATEN SAMPANG', provinceCode: '35' },
  { code: '3528', name: 'KABUPATEN PAMEKASAN', provinceCode: '35' },
  { code: '3529', name: 'KABUPATEN SUMENEP', provinceCode: '35' },
  { code: '3571', name: 'KOTA KEDIRI', provinceCode: '35' },
  { code: '3572', name: 'KOTA BLITAR', provinceCode: '35' },
  { code: '3573', name: 'KOTA MALANG', provinceCode: '35' },
  { code: '3574', name: 'KOTA PROBOLINGGO', provinceCode: '35' },
  { code: '3575', name: 'KOTA PASURUAN', provinceCode: '35' },
  { code: '3576', name: 'KOTA MOJOKERTO', provinceCode: '35' },
  { code: '3577', name: 'KOTA MADIUN', provinceCode: '35' },
  { code: '3578', name: 'KOTA SURABAYA', provinceCode: '35' },
  { code: '3579', name: 'KOTA BATU', provinceCode: '35' },

  // Banten
  { code: '3601', name: 'KABUPATEN PANDEGLANG', provinceCode: '36' },
  { code: '3602', name: 'KABUPATEN LEBAK', provinceCode: '36' },
  { code: '3603', name: 'KABUPATEN TANGERANG', provinceCode: '36' },
  { code: '3604', name: 'KABUPATEN SERANG', provinceCode: '36' },
  { code: '3671', name: 'KOTA TANGERANG', provinceCode: '36' },
  { code: '3672', name: 'KOTA CILEGON', provinceCode: '36' },
  { code: '3673', name: 'KOTA SERANG', provinceCode: '36' },
  { code: '3674', name: 'KOTA TANGERANG SELATAN', provinceCode: '36' },

  // DI Yogyakarta
  { code: '3401', name: 'KABUPATEN KULON PROGO', provinceCode: '34' },
  { code: '3402', name: 'KABUPATEN BANTUL', provinceCode: '34' },
  { code: '3403', name: 'KABUPATEN GUNUNG KIDUL', provinceCode: '34' },
  { code: '3404', name: 'KABUPATEN SLEMAN', provinceCode: '34' },
  { code: '3471', name: 'KOTA YOGYAKARTA', provinceCode: '34' },

  // Sample provinsi lainnya
  // Aceh
  { code: '1101', name: 'KABUPATEN SIMEULUE', provinceCode: '11' },
  { code: '1102', name: 'KABUPATEN ACEH SINGKIL', provinceCode: '11' },
  { code: '1103', name: 'KABUPATEN ACEH SELATAN', provinceCode: '11' },
  { code: '1171', name: 'KOTA BANDA ACEH', provinceCode: '11' },

  // Sumatera Utara
  { code: '1201', name: 'KABUPATEN NIAS', provinceCode: '12' },
  { code: '1271', name: 'KOTA MEDAN', provinceCode: '12' },
  { code: '1275', name: 'KOTA BINJAI', provinceCode: '12' },

  // Sumatera Barat
  { code: '1301', name: 'KABUPATEN KEPULAUAN MENTAWAI', provinceCode: '13' },
  { code: '1371', name: 'KOTA PADANG', provinceCode: '13' },
  { code: '1373', name: 'KOTA BUKITTINGGI', provinceCode: '13' },

  // Riau
  { code: '1401', name: 'KABUPATEN KUANTAN SINGINGI', provinceCode: '14' },
  { code: '1471', name: 'KOTA PEKANBARU', provinceCode: '14' },

  // Bali
  { code: '5101', name: 'KABUPATEN JEMBRANA', provinceCode: '51' },
  { code: '5102', name: 'KABUPATEN TABANAN', provinceCode: '51' },
  { code: '5103', name: 'KABUPATEN BADUNG', provinceCode: '51' },
  { code: '5104', name: 'KABUPATEN GIANYAR', provinceCode: '51' },
  { code: '5171', name: 'KOTA DENPASAR', provinceCode: '51' },

  // Kalimantan
  { code: '6171', name: 'KOTA PONTIANAK', provinceCode: '61' },
  { code: '6271', name: 'KOTA PALANGKA RAYA', provinceCode: '62' },
  { code: '6371', name: 'KOTA BANJARMASIN', provinceCode: '63' },
  { code: '6471', name: 'KOTA BALIKPAPAN', provinceCode: '64' },
  { code: '6472', name: 'KOTA SAMARINDA', provinceCode: '64' },

  // Sulawesi
  { code: '7171', name: 'KOTA MANADO', provinceCode: '71' },
  { code: '7371', name: 'KOTA MAKASSAR', provinceCode: '73' },
  { code: '7571', name: 'KOTA GORONTALO', provinceCode: '75' },

  // Papua
  { code: '9171', name: 'KOTA JAYAPURA', provinceCode: '91' },
  { code: '9271', name: 'KOTA SORONG', provinceCode: '92' },
];

/**
 * Data Kecamatan sample untuk Kota Sukabumi
 */
export const districtData = [
  // Kota Sukabumi (3272)
  { code: '327201', name: 'BAROS', regencyCode: '3272' },
  { code: '327202', name: 'LEMBURSITU', regencyCode: '3272' },
  { code: '327203', name: 'CIBEUREUM', regencyCode: '3272' },
  { code: '327204', name: 'CITAMIANG', regencyCode: '3272' },
  { code: '327205', name: 'WARUDOYONG', regencyCode: '3272' },
  { code: '327206', name: 'GUNUNG PUYUH', regencyCode: '3272' },
  { code: '327207', name: 'CIKOLE', regencyCode: '3272' },

  // Kabupaten Sukabumi (3202)
  { code: '320201', name: 'CISOLOK', regencyCode: '3202' },
  { code: '320202', name: 'CIKAKAK', regencyCode: '3202' },
  { code: '320203', name: 'PALABUHANRATU', regencyCode: '3202' },
  { code: '320204', name: 'SIMPENAN', regencyCode: '3202' },
  { code: '320205', name: 'BANTARGADUNG', regencyCode: '3202' },
  { code: '320206', name: 'TEGALBULEUD', regencyCode: '3202' },
  { code: '320207', name: 'CIDOLOG', regencyCode: '3202' },
  { code: '320208', name: 'SAGARANTEN', regencyCode: '3202' },
  { code: '320209', name: 'CURUGKEMBAR', regencyCode: '3202' },
  { code: '320210', name: 'CIRACAP', regencyCode: '3202' },

  // Kota Bandung sample (3273)
  { code: '327301', name: 'BANDUNG KULON', regencyCode: '3273' },
  { code: '327302', name: 'BABAKAN CIPARAY', regencyCode: '3273' },
  { code: '327303', name: 'BOJONGLOA KALER', regencyCode: '3273' },
  { code: '327304', name: 'BOJONGLOA KIDUL', regencyCode: '3273' },
  { code: '327305', name: 'ASTANAANYAR', regencyCode: '3273' },
  { code: '327306', name: 'REGOL', regencyCode: '3273' },
  { code: '327307', name: 'LENGKONG', regencyCode: '3273' },
  { code: '327308', name: 'BANDUNG KIDUL', regencyCode: '3273' },
  { code: '327309', name: 'BUAHBATU', regencyCode: '3273' },
  { code: '327310', name: 'RANCASARI', regencyCode: '3273' },
];

/**
 * Data Kelurahan/Desa sample
 */
export const villageData = [
  // Kecamatan Baros - Kota Sukabumi (327201)
  { code: '3272011001', name: 'BAROS', districtCode: '327201' },
  { code: '3272011002', name: 'JAYARAKSA', districtCode: '327201' },
  { code: '3272011003', name: 'SUKAKARYA', districtCode: '327201' },
  { code: '3272011004', name: 'SUDAJAYAHILIR', districtCode: '327201' },

  // Kecamatan Cibeureum - Kota Sukabumi (327203)
  { code: '3272031001', name: 'CIBEUREUM', districtCode: '327203' },
  { code: '3272031002', name: 'CIBEUREUM HILIR', districtCode: '327203' },
  { code: '3272031003', name: 'BABAKAN', districtCode: '327203' },
  { code: '3272031004', name: 'LIMUSNUNGGAL', districtCode: '327203' },

  // Kecamatan Palabuhanratu - Kabupaten Sukabumi (320203)
  { code: '3202031001', name: 'PALABUHANRATU', districtCode: '320203' },
  { code: '3202031002', name: 'CITEPUS', districtCode: '320203' },
  { code: '3202031003', name: 'CITARIK', districtCode: '320203' },
  { code: '3202031004', name: 'CIKADU', districtCode: '320203' },
];

export async function seedWilayahIndonesia() {
  console.log('🌍 Seeding Wilayah Indonesia...');

  // Clean up existing wilayah data
  console.log('   Cleaning existing wilayah data...');
  await prisma.village.deleteMany();
  await prisma.district.deleteMany();
  await prisma.regency.deleteMany();
  await prisma.province.deleteMany();

  // Seed Provinces
  console.log('   Seeding 34 Provinsi...');
  const provinceMap: Record<string, string> = {};
  for (const prov of provinsiData) {
    const province = await prisma.province.create({
      data: {
        code: prov.code,
        name: prov.name,
      },
    });
    provinceMap[prov.code] = province.id;
  }
  console.log(`   ✅ ${provinsiData.length} Provinsi created`);

  // Seed Regencies/Cities
  console.log('   Seeding Kabupaten/Kota...');
  const regencyMap: Record<string, string> = {};
  for (const reg of regencyData) {
    const regency = await prisma.regency.create({
      data: {
        code: reg.code,
        name: reg.name,
        provinceId: provinceMap[reg.provinceCode],
      },
    });
    regencyMap[reg.code] = regency.id;
  }
  console.log(`   ✅ ${regencyData.length} Kabupaten/Kota created`);

  // Seed Districts
  console.log('   Seeding Kecamatan...');
  const districtMap: Record<string, string> = {};
  for (const dist of districtData) {
    if (regencyMap[dist.regencyCode]) {
      const district = await prisma.district.create({
        data: {
          code: dist.code,
          name: dist.name,
          regencyId: regencyMap[dist.regencyCode],
        },
      });
      districtMap[dist.code] = district.id;
    }
  }
  console.log(`   ✅ ${districtData.length} Kecamatan created`);

  // Seed Villages
  console.log('   Seeding Kelurahan/Desa...');
  for (const vill of villageData) {
    if (districtMap[vill.districtCode]) {
      await prisma.village.create({
        data: {
          code: vill.code,
          name: vill.name,
          districtId: districtMap[vill.districtCode],
        },
      });
    }
  }
  console.log(`   ✅ ${villageData.length} Kelurahan/Desa created`);

  console.log('🌍 Wilayah Indonesia seeding completed!');
  console.log(`   Total: ${provinsiData.length} Provinsi, ${regencyData.length} Kabupaten/Kota, ${districtData.length} Kecamatan, ${villageData.length} Kelurahan`);

  return {
    provinceMap,
    regencyMap,
    districtMap,
  };
}

export default seedWilayahIndonesia;
