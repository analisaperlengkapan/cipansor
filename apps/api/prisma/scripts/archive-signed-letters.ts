/**
 * Mengarsipkan byte naskah surat-surat yang ditandatangani sebelum arsip ada.
 *
 * Sejak PR-3, `signLetter` menyimpan byte PDF final di dalam transaksi yang
 * sama dengan tanda tangannya. Surat yang ditandatangani sebelum itu tidak
 * punya arsip, dan unduhannya masih dibuat ulang setiap kali — persis bahaya
 * yang dijelaskan `docs/EOFFICE_ESIGN_PLAN.md` §2.4.
 *
 * Skrip ini menutup celah itu **hanya untuk surat yang byte-nya masih dapat
 * dibuat ulang persis.** Naskah dirender ulang, hash-nya dihitung, dan barisnya
 * ditulis hanya bila hash itu sama dengan `pdfHash` yang ditandatangani. Surat
 * yang sudah menyimpang tidak diarsipkan dengan byte yang salah — byte itu
 * bukan yang ditandatangani, dan menyimpannya seolah-olah begitu justru
 * memalsukan arsip. Yang menyimpang dilaporkan, supaya diketahui, bukan
 * ditutupi.
 *
 * Aman dijalankan berulang: hanya menulis baris baru, tidak pernah mengubah
 * atau menghapus apa pun.
 *
 *   pnpm --filter api db:archive-letters          # laporan + penulisan
 *   pnpm --filter api db:archive-letters --dry-run
 */
import crypto from 'crypto';
import { createPrismaClient } from '../client';
import {
  generateLetterPdfBuffer,
  LETTER_PDF_GENERATOR,
} from '../../src/utils/generate-letter-pdf';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  const prisma = createPrismaClient();
  try {
    const pending = await prisma.letterSignature.findMany({
      where: { pdfHash: { not: null }, document: { is: null } },
      select: { id: true, letterId: true, pdfHash: true },
      orderBy: { signedAt: 'asc' },
    });

    console.log(
      `${pending.length} tanda tangan tanpa arsip${dryRun ? ' (dry run — tidak menulis apa pun)' : ''}.`
    );

    let archived = 0;
    const drifted: Array<{ letterNumber: string; signatureId: string }> = [];

    for (const sig of pending) {
      const letter = await prisma.letter.findUnique({
        where: { id: sig.letterId },
        include: {
          unit: true,
          signatures: {
            include: {
              signer: {
                select: {
                  name: true,
                  teacher: { select: { nip: true } },
                  staff: { select: { nip: true } },
                },
              },
            },
          },
        },
      });
      if (!letter) continue;

      let hash: string;
      let bytes: Buffer;
      try {
        bytes = await generateLetterPdfBuffer(letter);
        hash = crypto.createHash('sha256').update(bytes).digest('hex');
      } catch (e) {
        drifted.push({
          letterNumber: letter.letterNumber ?? letter.id,
          signatureId: sig.id,
        });
        console.warn(`  ✗ ${letter.letterNumber ?? letter.id}: gagal dirender — ${String(e)}`);
        continue;
      }

      if (hash !== sig.pdfHash) {
        drifted.push({ letterNumber: letter.letterNumber ?? letter.id, signatureId: sig.id });
        console.warn(
          `  ✗ ${letter.letterNumber ?? letter.id}: byte-nya sudah menyimpang dari yang ditandatangani.`
        );
        continue;
      }

      if (!dryRun) {
        await prisma.letterSignedDocument.create({
          data: {
            signatureId: sig.id,
            bytes: new Uint8Array(bytes),
            sha256: hash,
            byteSize: bytes.length,
            generator: LETTER_PDF_GENERATOR,
          },
        });
      }
      archived += 1;
      console.log(`  ✓ ${letter.letterNumber ?? letter.id}`);
    }

    console.log(`\nDiarsipkan: ${archived}. Menyimpang: ${drifted.length}.`);
    if (drifted.length) {
      console.log(
        'Surat yang menyimpang tidak dapat diarsipkan dengan jujur: byte yang dapat dihasilkan\n' +
          'hari ini bukan byte yang ditandatangani. Salinan aslinya, bila masih ada di tangan\n' +
          'penerima, tetap terverifikasi; yang tidak dapat lagi dilakukan adalah mencetak ulang.'
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
