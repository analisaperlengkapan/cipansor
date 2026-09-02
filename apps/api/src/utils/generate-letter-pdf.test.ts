import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import zlib from 'zlib';
import { generateLetterPdfBuffer, stampRevoked, LetterPdfInput } from './generate-letter-pdf';

describe('generateLetterPdfBuffer determinism', () => {
  it('generates 100% byte-identical PDFs when called twice with the same letter data', async () => {
    const mockLetter: LetterPdfInput = {
      id: 'letter-123',
      letterNumber: '001/YPC/X/2025',
      agendaNumber: 'AG-001',
      date: new Date('2025-05-15T00:00:00.000Z'),
      type: 'SURAT_DINAS',
      nature: 'PUBLIC',
      subject: 'Undangan Rapat Kerja Yayasan',
      content: 'Dengan hormat,\n\nSehubungan dengan agenda tahunan Yayasan Pesantren Cipansor...',
      senderName: 'Ustadz Ahmad',
      senderTitle: 'Sekretaris Yayasan',
      recipientName: 'Bapak Kepala Sekolah',
      unit: {
        name: 'SMP IT CIPANSOR',
        address: 'Jl. Pesantren No. 12',
        phone: '081234567890',
        email: 'smpit@cipansor.or.id',
      },
      signatures: [
        {
          verificationToken: 'test-token-abcdef123456',
          signedAt: new Date('2025-05-15T10:00:00.000Z'),
          signer: {
            name: 'Ustadz Ahmad',
            teacher: { nip: '198501012010011001' },
          },
        },
      ],
    };

    const pdf1 = await generateLetterPdfBuffer(mockLetter);
    const pdf2 = await generateLetterPdfBuffer(mockLetter);

    const hash1 = crypto.createHash('sha256').update(pdf1).digest('hex');
    const hash2 = crypto.createHash('sha256').update(pdf2).digest('hex');

    expect(hash1).toEqual(hash2);
    expect(pdf1.equals(pdf2)).toBe(true);
  });
});

/**
 * Apa yang benar-benar tercetak, dibaca dari lapisan teksnya.
 *
 * Kedua cacat di bawah lolos dari setiap uji yang ada karena semuanya
 * memeriksa byte, bukan bacaan. Keduanya baru terlihat ketika naskahnya
 * benar-benar dirender menjadi gambar dan dibaca.
 */
function letterWith(over: Partial<LetterPdfInput>): LetterPdfInput {
  return {
    id: 'letter-1',
    letterNumber: '434/Sket/Y-CPS/IX/2026',
    date: new Date('2026-09-01T00:00:00.000Z'),
    type: 'SURAT_KETERANGAN',
    nature: 'PUBLIC',
    subject: 'Keterangan Aktif Santri',
    content: 'Isi.',
    unit: { name: 'Yayasan Pesantren Cipansor', address: 'Tasikmalaya' },
    signatures: [],
    ...over,
  } as LetterPdfInput;
}

/**
 * Teks yang benar-benar tercetak, termasuk yang ada di dalam aliran terkompresi.
 *
 * Dua hal membuat pembacaan mentah keliru. Aliran isinya dipadatkan dengan
 * Flate, dan berkas yang dimuat ulang lalu disimpan lagi — seperti salinan
 * bercap — menulis teksnya sebagai untai heksadesimal `<…> Tj`, bukan literal
 * `(…) Tj`. Membaca berkasnya sebagai latin1 belaka akan mengira capnya tidak
 * ada padahal ia tercetak.
 */
function pdfText(pdf: Buffer): string {
  const raw = pdf.toString('latin1');
  let out = raw;
  // `indexOf('stream')` juga mengenai 'endstream'; awalan baris memisahkannya.
  const re = /[\r\n]stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const start = m.index + m[0].length;
    const end = raw.indexOf('endstream', start);
    if (end === -1) break;
    try {
      out += zlib
        .inflateSync(Buffer.from(raw.slice(start, end), 'latin1'))
        .toString('latin1');
    } catch {
      // Bukan aliran Flate, atau terpotong — abaikan.
    }
  }
  // Untai heksadesimal dibaca kembali menjadi teksnya.
  out += out.replace(/<([0-9A-Fa-f]{4,})>/g, (_all, hex: string) =>
    Buffer.from(hex, 'hex').toString('latin1')
  );
  return out;
}

function countInPdf(pdf: Buffer, needle: string): number {
  return pdfText(pdf).split(needle).length - 1;
}

describe('kop surat', () => {
  /**
   * Untuk naskah yang terbit dari yayasan sendiri, nama unit dan nama yayasan
   * adalah kalimat yang sama — dan kop suratnya mencetaknya dua kali bertumpuk.
   */
  it('tidak mencetak nama yayasan dua kali pada naskah yayasan', async () => {
    const pdf = await generateLetterPdfBuffer(
      letterWith({ unit: { name: 'Yayasan Pesantren Cipansor', address: 'Tasikmalaya' } })
    );
    expect(countInPdf(pdf, 'YAYASAN PESANTREN CIPANSOR')).toBe(1);
  });

  it('tetap dua baris untuk naskah yang terbit dari unit', async () => {
    const pdf = await generateLetterPdfBuffer(
      letterWith({ unit: { name: 'MTs Cipansor', address: 'Tasikmalaya' } })
    );
    expect(countInPdf(pdf, 'YAYASAN PESANTREN CIPANSOR')).toBe(1);
    expect(countInPdf(pdf, 'MTS CIPANSOR')).toBe(1);
  });
});

describe('isi naskah', () => {
  /**
   * Blok data yang ditulis penyusunnya baris per baris — bentuk yang ada di
   * hampir setiap surat keterangan — sebelumnya tercetak berdempet menjadi satu
   * paragraf panjang, karena hanya baris kosong ganda yang memisahkan alinea.
   */
  it('menghormati pergantian baris tunggal di dalam alinea', async () => {
    const pdf = await generateLetterPdfBuffer(
      letterWith({
        content:
          'Menerangkan bahwa:\n\nNama : Ahmad Fauzan\nNomor Induk : 2024.07.0091\nKelas : IX MTs',
      })
    );
    const text = pdfText(pdf);
    // Tiga baris data berdiri sendiri, bukan tergabung menjadi satu.
    expect(text).toContain('Nama : Ahmad Fauzan');
    expect(text).toContain('Nomor Induk : 2024.07.0091');
    expect(text).toContain('Kelas : IX MTs');
    expect(text).not.toContain('Ahmad Fauzan Nomor Induk');
  });
});

describe('cap DICABUT', () => {
  it('membubuhkan cap dan keterangan pencabutannya pada setiap halaman', async () => {
    const clean = await generateLetterPdfBuffer(letterWith({}));
    const stamped = await stampRevoked(clean, {
      reason: 'Nomor surat ganda dengan 433/Sket/Y-CPS/IX/2026.',
      revokedAt: new Date('2026-09-02T07:30:00.000Z'),
      revokedByName: 'H. Endang Suryana',
    });

    const text = pdfText(stamped);
    expect(text).toContain('DICABUT');
    expect(text).toContain('H. Endang Suryana');
    expect(text).toContain('2026-09-02');
    expect(countInPdf(clean, 'DICABUT')).toBe(0);
  });

  /**
   * Yang dicap adalah SALINAN. Berkas yang ditandatangani tidak boleh berubah,
   * sebab hash byte-nyalah yang dipakai verifikasi publik.
   */
  it('tidak mengubah berkas yang ditandatangani', async () => {
    const clean = await generateLetterPdfBuffer(letterWith({}));
    const before = crypto.createHash('sha256').update(clean).digest('hex');
    await stampRevoked(clean, {
      reason: 'Alasan yang cukup panjang.',
      revokedAt: new Date('2026-09-02T07:30:00.000Z'),
    });
    expect(crypto.createHash('sha256').update(clean).digest('hex')).toBe(before);
  });

  /**
   * Menolak mencetak cap karena alasannya memuat satu aksara di luar WinAnsi
   * akan meninggalkan naskah yang sudah dicabut beredar tanpa tanda apa pun.
   */
  it('tetap mencetak walau alasannya memuat aksara di luar WinAnsi', async () => {
    const clean = await generateLetterPdfBuffer(letterWith({}));
    await expect(
      stampRevoked(clean, {
        reason: 'Dicabut sesuai keputusan rapat — بسم الله',
        revokedAt: new Date('2026-09-02T07:30:00.000Z'),
      })
    ).resolves.toBeInstanceOf(Buffer);
  });
});
