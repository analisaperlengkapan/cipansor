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
 */
import { createPrismaClient } from '../client';
import { deleteIdentityDocument } from '../../src/utils/identity-document-store';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  const prisma = createPrismaClient();
  try {
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
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
