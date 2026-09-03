/**
 * Hapus foto KTP yang masa simpannya sudah lewat.
 *
 * Retensi yang hanya dijanjikan bukan retensi. `ktpRetainUntil` menetapkan
 * sampai kapan sebuah berkas boleh ada; tanpa sesuatu yang benar-benar
 * menghapusnya, kolom itu hanyalah tanggal di dalam basis data sementara
 * berkasnya tetap di disk selamanya — dan janji "disimpan sampai tanggal
 * sekian" menjadi pernyataan yang tidak pernah diuji siapa pun.
 *
 * Dijalankan sebagai perintah, bukan penjadwal di dalam proses: penjadwal yang
 * mati semalam tidak memberi tahu siapa pun, sedangkan perintah yang tidak
 * dijalankan meninggalkan jejak di crontab yang dapat diperiksa. Jalankan
 * berkala:
 *
 *     pnpm --filter api db:purge-identity-documents [--dry-run]
 *
 * `ktpDeletedAt` diisi supaya penghapusannya dapat ditunjukkan: sebuah kolom
 * kosong tidak dapat membedakan "sudah dihapus" dari "tidak pernah ada".
 *
 * Perintahnya berjalan dua tahap, dan tahap kedua ada justru karena tahap
 * pertama tidak dapat melihatnya. Tahap pertama berangkat dari basis data:
 * baris yang masa simpannya lewat, berkas yang disebutnya, dihapus. Tahap kedua
 * berangkat dari disk, dan hanya arah itu yang dapat menemukan berkas yang
 * barisnya sudah tidak ada — sesuatu yang tidak disebut baris mana pun tidak
 * akan pernah muncul dalam kueri mana pun.
 */
import { createPrismaClient } from '../client';
import {
  deleteIdentityDocument,
  listIdentityDocuments,
  orphanedIdentityDocuments,
} from '../../src/utils/identity-document-store';

const dryRun = process.argv.includes('--dry-run');

/**
 * Tahap satu: berkas yang masa simpannya sudah lewat, menurut barisnya sendiri.
 */
async function purgeExpired(prisma: ReturnType<typeof createPrismaClient>) {
  const expired = await prisma.userIdentity.findMany({
    where: {
      ktpFileName: { not: null },
      ktpRetainUntil: { not: null, lte: new Date() },
    },
    select: {
      userId: true,
      ktpFileName: true,
      ktpRetainUntil: true,
      user: { select: { name: true } },
    },
  });

  console.log(
    `${expired.length} berkas identitas melewati masa simpannya` +
      `${dryRun ? ' (dry run — tidak menghapus apa pun)' : ''}.`
  );

  for (const row of expired) {
    const until = row.ktpRetainUntil?.toISOString().slice(0, 10);
    console.log(`  ${row.user?.name ?? row.userId} — batas simpan ${until}`);
    if (dryRun) continue;

    await deleteIdentityDocument(row.ktpFileName!);
    await prisma.userIdentity.update({
      where: { userId: row.userId },
      data: { ktpFileName: null, ktpDeletedAt: new Date() },
    });
  }

  if (!dryRun && expired.length > 0) {
    console.log(`${expired.length} berkas dihapus.`);
  }
}

/**
 * Tahap dua: berkas di disk yang tidak dirujuk baris mana pun.
 *
 * Cara sebuah berkas sampai ke sini bukan satu, dan tidak satu pun di antaranya
 * meninggalkan galat yang terlihat:
 *
 * - `UserIdentity` punya `onDelete: Cascade` ke `User`. Menghapus penggunanya —
 *   lewat SQL langsung, atau `seed.ts` yang melakukan TRUNCATE — melenyapkan
 *   barisnya beserta nama berkasnya, sementara berkasnya sendiri tinggal.
 * - Unggahannya menulis berkas dulu, baru barisnya menyusul. Proses yang mati
 *   di antara keduanya menyisakan berkas yang tidak pernah tercatat.
 * - Basis data dipulihkan dari cadangan yang lebih tua daripada volumenya.
 *
 * Yang tersisa dalam ketiga kasus itu adalah foto KTP di disk tanpa apa pun
 * yang menyatakan siapa pemiliknya, mengapa ia ada, atau sampai kapan ia boleh
 * disimpan — persis bentuk penyimpanan yang tidak dapat dipertanggungjawabkan
 * kepada orang yang KTP-nya ada di dalamnya.
 *
 * Membandingkannya terhadap **seluruh** `ktpFileName` yang bukan null, bukan
 * hanya yang sudah kedaluwarsa: apa pun yang masih dirujuk satu baris mana pun
 * bukan yatim.
 */
async function sweepOrphans(prisma: ReturnType<typeof createPrismaClient>) {
  const onDisk = await listIdentityDocuments();
  const rows = await prisma.userIdentity.findMany({
    where: { ktpFileName: { not: null } },
    select: { ktpFileName: true },
  });

  const orphans = orphanedIdentityDocuments(
    onDisk,
    rows.map((r) => r.ktpFileName!)
  );

  console.log(
    `${onDisk.length} berkas di disk, ${rows.length} dirujuk basis data, ` +
      `${orphans.length} yatim` +
      `${dryRun ? ' (dry run — tidak menghapus apa pun)' : ''}.`
  );

  for (const orphan of orphans) {
    const age = orphan.modifiedAt.toISOString().slice(0, 10);
    console.log(`  ${orphan.fileName} — ditulis ${age}, tanpa baris`);
    if (dryRun) continue;
    await deleteIdentityDocument(orphan.fileName);
  }

  if (!dryRun && orphans.length > 0) {
    console.log(`${orphans.length} berkas yatim dihapus.`);
  }
}

async function main() {
  const prisma = createPrismaClient();
  try {
    await purgeExpired(prisma);
    await sweepOrphans(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
