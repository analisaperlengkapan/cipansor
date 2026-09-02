import { PDFDocument, PDFFont, PDFPage, StandardFonts, degrees, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import {
  DECIDING_OFFICIAL,
  LETTERHEAD,
  letterTemplateFor,
  natureMarking,
  siteConfig,
  type LetterNature,
  type LetterType,
} from '@cipansor/shared';
import { LOGO_CIPANSOR_PNG_BASE64 } from '@/assets/logo-cipansor';

/** "KETUA YAYASAN …" → "Ketua Yayasan …", as it is written under a signature. */
const DECIDING_OFFICIAL_TITLE_CASE = DECIDING_OFFICIAL.split(' ')
  .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
  .join(' ');

/**
 * The naskah dinas, rendered as a real PDF.
 *
 * Text stays text and images stay images. The web app used to hand
 * `html2canvas` output to `jsPDF.addImage`, so a downloaded letter was a single
 * flat PNG: nothing could be selected, searched, or indexed by the archive, a
 * screen reader got nothing, and — decisively — a raster page cannot carry a
 * meaningful PAdES signature. Everything here is drawn with `drawText`; the
 * only images are the lambang and the QR, which are images by nature.
 *
 * **Byte determinism is a contract, not a nicety.** `LetterSignature.pdfHash`
 * is a SHA-256 of these bytes, and public verification works by re-hashing an
 * uploaded PDF and looking the hash up. So the creation and modification dates
 * are pinned to epoch 0, the lambang is frozen in source rather than read from
 * disk or a URL, and no clock or locale outside the letter's own data may leak
 * into the output. Anything that changes the bytes retroactively invalidates
 * every letter signed before the change — they would be reported to the public
 * as altered. Treat a change here as a migration.
 */

export class LetterPdfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LetterPdfError';
  }
}

export interface LetterPdfInput {
  id: string;
  letterNumber?: string | null;
  agendaNumber?: string | null;
  date: Date | string;
  type?: string | null;
  nature?: string | null;
  subject: string;
  content?: string | null;
  senderName?: string | null;
  senderTitle?: string | null;
  recipientName?: string | null;
  recipientInstance?: string | null;
  unit?: {
    name?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  signatures?: Array<{
    verificationToken: string;
    signedAt: Date | string;
    revokedAt?: Date | string | null;
    signer?: {
      name: string;
      teacher?: { nip?: string | null } | null;
      staff?: { nip?: string | null } | null;
    } | null;
  }> | null;
}

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 40;
/** Nothing is drawn below this; the footer and page number live here. */
const BOTTOM_LIMIT = 56;
const BODY_SIZE = 10;
const LINE_HEIGHT = 14;

/**
 * The characters the PDF standard fonts can actually encode.
 *
 * `StandardFonts.TimesRoman` and its siblings are WinAnsi-encoded, and pdf-lib
 * throws when asked to draw anything outside that repertoire. Arabic is the
 * realistic case here — a pesantren letter may well quote the Qur'an — and
 * before this guard the throw was swallowed by a `try/catch` in the signing
 * path, producing a letter that was SIGNED but could never be verified.
 *
 * We refuse clearly instead of failing obscurely. Supporting Arabic properly
 * needs an embedded Unicode font *and* a shaping engine (pdf-lib does neither:
 * fontkit would embed the glyphs, but contextual joining and right-to-left
 * ordering would still be wrong), plus a build change to ship the font. That is
 * tracked separately — see `docs/EOFFICE_ESIGN_PLAN.md`.
 */
const WINANSI_EXTRA = new Set(
  '€‚ƒ„…†‡ˆ‰Š‹ŒŽ' +
    '‘’“”•–—˜™š›œžŸ'
);

function isEncodable(ch: string): boolean {
  const code = ch.codePointAt(0)!;
  if (code === 0x0a || code === 0x0d || code === 0x09) return true;
  if (code >= 0x20 && code <= 0x7e) return true;
  if (code >= 0xa0 && code <= 0xff) return true;
  return WINANSI_EXTRA.has(ch);
}

/** Distinct characters in `text` that the naskah font cannot render. */
/**
 * Ganti aksara yang tidak dapat dikodekan WinAnsi dengan tanda tanya.
 *
 * Dipakai HANYA pada keterangan pencabutan, bukan pada naskahnya. Sebuah naskah
 * yang memuat aksara di luar WinAnsi ditolak sejak awal (`assertRenderable`)
 * supaya penulisnya memperbaikinya — tetapi menolak mencetak cap pencabutan
 * karena alasannya memuat satu aksara asing akan meninggalkan surat yang sudah
 * dicabut beredar tanpa tanda apa pun. Di sini, tercetak dengan satu aksara
 * pengganti jauh lebih baik daripada tidak tercetak.
 */
function sanitizeForWinAnsi(text: string): string {
  return [...text].map((ch) => (isEncodable(ch) ? ch : '?')).join('');
}

function unsupportedCharacters(text: string): string[] {
  const bad = new Set<string>();
  for (const ch of text) if (!isEncodable(ch)) bad.add(ch);
  return [...bad];
}

function assertRenderable(letter: LetterPdfInput): void {
  const fields: Array<[string, string | null | undefined]> = [
    ['Perihal', letter.subject],
    ['Isi surat', letter.content],
    ['Penerima', letter.recipientName],
    ['Instansi penerima', letter.recipientInstance],
    ['Jabatan penanda tangan', letter.senderTitle],
    ['Nama pengirim', letter.senderName],
  ];

  const offenders = new Set<string>();
  const where: string[] = [];
  for (const [label, value] of fields) {
    if (!value) continue;
    const bad = unsupportedCharacters(value);
    if (bad.length) {
      bad.forEach((c) => offenders.add(c));
      where.push(label);
    }
  }

  if (offenders.size) {
    throw new LetterPdfError(
      `Naskah memuat karakter yang belum didukung pada PDF resmi (${where.join(', ')}): ` +
        `${[...offenders].join(' ')}. Aksara Arab dan simbol di luar Latin belum dapat ` +
        `dicetak pada naskah dinas. Ganti bagian tersebut dengan transliterasi Latin, ` +
        `atau sertakan sebagai lampiran gambar.`
    );
  }
}

/**
 * A cursor that spills onto a new page instead of dropping content.
 *
 * The previous version created exactly one page and stopped drawing at
 * `if (y < 120) break;`, so any letter longer than a page was silently
 * truncated — and the truncated render was what got hashed and signed. A
 * multi-article SK was cut off mid-way and still verified as authentic.
 */
class Cursor {
  readonly pages: PDFPage[] = [];
  page!: PDFPage;
  y = 0;

  constructor(private readonly doc: PDFDocument) {
    this.newPage(PAGE_HEIGHT - 40);
  }

  newPage(startY = PAGE_HEIGHT - 60): PDFPage {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.pages.push(this.page);
    this.y = startY;
    return this.page;
  }

  /** Guarantee `height` points of room, breaking the page if necessary. */
  ensure(height: number): void {
    if (this.y - height < BOTTOM_LIMIT) this.newPage();
  }

  text(
    value: string,
    opts: { x: number; size?: number; font: PDFFont; color?: ReturnType<typeof rgb> }
  ): void {
    const size = opts.size ?? BODY_SIZE;
    this.ensure(size + 2);
    this.page.drawText(value, {
      x: opts.x,
      y: this.y,
      size,
      font: opts.font,
      color: opts.color ?? rgb(0, 0, 0),
    });
  }

  down(by = LINE_HEIGHT): void {
    this.y -= by;
  }
}

function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(testLine, fontSize) <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function generateLetterPdfBuffer(letter: LetterPdfInput): Promise<Buffer> {
  assertRenderable(letter);

  const pdfDoc = await PDFDocument.create();

  // Fix dates to Epoch 0 for byte determinism — see the module comment.
  pdfDoc.setCreationDate(new Date(0));
  pdfDoc.setModificationDate(new Date(0));
  pdfDoc.setTitle(`Surat ${letter.letterNumber || letter.agendaNumber || 'Draft'}`);
  pdfDoc.setProducer('Cipansor E-Office');
  pdfDoc.setCreator('Cipansor E-Office');

  const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontTimesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  const cur = new Cursor(pdfDoc);
  const width = PAGE_WIDTH;
  const centreOf = (text: string, font: PDFFont, size: number) =>
    width / 2 - font.widthOfTextAtSize(text, size) / 2;

  // ── Kop surat ────────────────────────────────────────────────────────────
  // The lambang is the one element that genuinely must be an image. Dropping it
  // when this generator replaced the browser render would have produced a kop
  // surat with no crest at all, which is not a letterhead.
  const logo = await pdfDoc.embedPng(Buffer.from(LOGO_CIPANSOR_PNG_BASE64, 'base64'));
  const logoHeight = 62;
  const logoWidth = (logo.width / logo.height) * logoHeight;
  cur.page.drawImage(logo, {
    x: MARGIN_X + 6,
    y: cur.y - logoHeight + 12,
    width: logoWidth,
    height: logoHeight,
  });

  const orgName = 'YAYASAN PESANTREN CIPANSOR';
  const unitName = letter.unit?.name?.toUpperCase() ?? 'KANTOR YAYASAN';
  const legalBasis = 'SK Kemenkumham RI No. AHU-0012345.AH.01.04.Tahun 2020';
  const address = letter.unit?.address ?? 'Jl. Raya Cipansor No. 01, Tasikmalaya, Jawa Barat';
  const contact = `Website: cipansor.or.id | Telp: ${letter.unit?.phone || '0265-123456'} | Email: ${letter.unit?.email || 'halo@cipansor.or.id'}`;

  cur.text(orgName, { x: centreOf(orgName, fontTimesBold, 12), size: 12, font: fontTimesBold });
  cur.down(16);
  cur.text(unitName, { x: centreOf(unitName, fontTimesBold, 14), size: 14, font: fontTimesBold });
  cur.down(14);
  cur.text(legalBasis, {
    x: centreOf(legalBasis, fontTimesItalic, 8),
    size: 8,
    font: fontTimesItalic,
    color: rgb(0.2, 0.2, 0.2),
  });
  cur.down(12);
  cur.text(address, {
    x: centreOf(address, fontTimes, 8),
    size: 8,
    font: fontTimes,
    color: rgb(0.2, 0.2, 0.2),
  });
  cur.down(12);
  cur.text(contact, {
    x: centreOf(contact, fontTimes, 8),
    size: 8,
    font: fontTimes,
    color: rgb(0.2, 0.2, 0.2),
  });
  cur.down(14);

  cur.page.drawLine({
    start: { x: MARGIN_X, y: cur.y },
    end: { x: width - MARGIN_X, y: cur.y },
    thickness: 2,
    color: rgb(0, 0, 0),
  });
  cur.down(4);
  cur.page.drawLine({
    start: { x: MARGIN_X, y: cur.y },
    end: { x: width - MARGIN_X, y: cur.y },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });
  cur.down(25);

  const type = ((letter.type as LetterType) || 'SURAT_DINAS') as LetterType;
  const template = letterTemplateFor(type);
  const isDecree = template.decree === true;
  const marking = natureMarking(letter.nature as LetterNature);

  const dateStr = new Date(letter.date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
  const numberStr = letter.letterNumber || letter.agendaNumber || 'DRAFT';

  /**
   * Naskah dinas is not one shape.
   *
   * `template.title` decides whether the type is announced as a centred heading
   * above the number; `template.addressed` decides whether the naskah carries
   * "Kepada Yth." and closes "Hormat Kami,". They are separate axes — an
   * undangan is titled *and* addressed, a surat keterangan is titled and
   * addressed to no one, a surat dinas is neither. This mirrors
   * `letter-pdf-template.tsx` on purpose: the PDF that gets signed must be the
   * same naskah the staff approved on screen, or the signature attests to a
   * document nobody reviewed.
   */

  // "TERBATAS" / "RAHASIA" / "SANGAT RAHASIA" — a Biasa letter is left unmarked,
  // because stamping every letter drains the meaning from the ones that matter.
  if (marking) {
    cur.text(marking, {
      x: width - MARGIN_X - fontTimesBold.widthOfTextAtSize(marking, 11),
      size: 11,
      font: fontTimesBold,
    });
    cur.down(18);
  }

  if (template.title) {
    cur.text(template.title.toUpperCase(), {
      x: centreOf(template.title.toUpperCase(), fontTimesBold, 13),
      size: 13,
      font: fontTimesBold,
    });
    cur.down(16);

    const nomor = `Nomor: ${numberStr}`;
    cur.text(nomor, { x: centreOf(nomor, fontTimes, BODY_SIZE), font: fontTimes });
    cur.down(18);

    // "Tentang" carries the actual subject of a keputusan, edaran or
    // pengumuman — the type alone never says what was decided.
    if (template.subjectHeading && letter.subject) {
      cur.text('Tentang', { x: centreOf('Tentang', fontTimes, BODY_SIZE), font: fontTimes });
      cur.down();
      const pokok = letter.subject.toUpperCase();
      for (const line of wrapText(pokok, width - MARGIN_X * 4, fontTimesBold, 11)) {
        cur.text(line, { x: centreOf(line, fontTimesBold, 11), size: 11, font: fontTimesBold });
        cur.down();
      }
      cur.down(10);
    }

    // The office that decides, standing alone before the considerans.
    if (isDecree) {
      cur.text(DECIDING_OFFICIAL, {
        x: centreOf(DECIDING_OFFICIAL, fontTimesBold, 11),
        size: 11,
        font: fontTimesBold,
      });
      cur.down(20);
    }
  } else {
    cur.text(`Nomor     : ${numberStr}`, { x: MARGIN_X, font: fontTimes });
    cur.page.drawText(`${LETTERHEAD.city}, ${dateStr}`, {
      x: width - 180,
      y: cur.y,
      size: BODY_SIZE,
      font: fontTimes,
    });
    cur.down();
    cur.text('Lampiran : -', { x: MARGIN_X, font: fontTimes });
    cur.down();
    cur.text(`Perihal   : ${letter.subject}`, { x: MARGIN_X, font: fontTimesBold });
    cur.down(25);
  }

  if (template.addressed) {
    const recipient = letter.recipientName || letter.recipientInstance || 'Bapak/Ibu';
    cur.text('Kepada Yth.', { x: MARGIN_X, font: fontTimes });
    cur.down();
    cur.text(recipient, { x: MARGIN_X, font: fontTimesBold });
    cur.down();
    cur.text('di Tempat', { x: MARGIN_X, font: fontTimes });
    cur.down(30);
  }

  // ── Body ─────────────────────────────────────────────────────────────────
  const contentMaxWidth = width - MARGIN_X * 2;
  const paragraphs = (letter.content || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  for (const para of paragraphs) {
    // "MEMUTUSKAN" stands alone and centred, separating the considerans from
    // the diktum. Recognised from the author's own paragraph rather than
    // injected, so the content stays one editable text.
    if (isDecree && /^MEMUTUSKAN:?$/i.test(para)) {
      const word = para.toUpperCase();
      cur.down(6);
      cur.text(word, { x: centreOf(word, fontTimesBold, 11), size: 11, font: fontTimesBold });
      cur.down(20);
      continue;
    }
    for (const line of wrapText(para, contentMaxWidth, fontTimes, BODY_SIZE)) {
      cur.text(line, { x: MARGIN_X, font: fontTimes });
      cur.down();
    }
    cur.down(8);
  }

  // ── Signature block ──────────────────────────────────────────────────────
  const activeSignature = (letter.signatures || []).filter((s) => !s.revokedAt).slice(-1)[0];
  // Reserve the whole block so it can never be split across pages or land on
  // top of the body: date + org + title + QR + captions + name + NIP.
  cur.ensure(activeSignature ? 200 : 150);
  cur.down(20);

  const rightAlignX = width - 220;

  if (isDecree) {
    // A keputusan records where it was *established*, not where a letter was
    // written, so it never closes "Tasikmalaya, <tanggal>" like a surat.
    cur.text(`Ditetapkan di : ${LETTERHEAD.city}`, { x: rightAlignX, font: fontTimes });
    cur.down();
    cur.text(`Pada tanggal  : ${dateStr}`, { x: rightAlignX, font: fontTimes });
    cur.down();
    cur.text(DECIDING_OFFICIAL_TITLE_CASE, { x: rightAlignX, font: fontTimes });
    cur.down();
  } else if (template.addressed) {
    cur.text('Hormat Kami,', { x: rightAlignX, font: fontTimes });
    cur.down();
  } else {
    cur.text(`${LETTERHEAD.city}, ${dateStr}`, { x: rightAlignX, font: fontTimes });
    cur.down();
    cur.text(siteConfig.legalName, { x: rightAlignX, font: fontTimes });
    cur.down();
    if (letter.senderTitle) {
      cur.text(letter.senderTitle, { x: rightAlignX, font: fontTimes });
      cur.down();
    }
  }

  if (activeSignature) {
    const qrBuffer = await QRCode.toBuffer(activeSignature.verificationToken, {
      type: 'png',
      margin: 1,
      width: 150,
    });
    const qrImage = await pdfDoc.embedPng(qrBuffer);
    cur.page.drawImage(qrImage, {
      x: rightAlignX + 20,
      y: cur.y - 65,
      width: 65,
      height: 65,
    });
    cur.down(72);

    // Hanya keterangan cara penandatanganan — tanggalnya tidak diulang di sini.
    // Naskah sudah memuat tanggalnya sekali, di kepala surat atau pada kaki
    // "Pada tanggal", dan mencetaknya dua kali dengan format berbeda membuat
    // pembaca bertanya mana yang berlaku.
    cur.text('Ditandatangani secara elektronik', {
      x: rightAlignX,
      size: 7,
      font: fontTimesItalic,
      color: rgb(0.3, 0.3, 0.3),
    });
    cur.down(12);
  } else {
    cur.down(50); // room for a wet signature
  }

  const signerName =
    activeSignature?.signer?.name || letter.senderName || '.........................';
  const signerNip =
    activeSignature?.signer?.teacher?.nip || activeSignature?.signer?.staff?.nip || '-';

  cur.text(signerName, { x: rightAlignX, font: fontTimesBold });
  cur.down(12);
  if (signerNip !== '-') {
    cur.text(`NIP. ${signerNip}`, { x: rightAlignX, size: 9, font: fontTimes });
    cur.down(12);
  }

  // ── Footers ──────────────────────────────────────────────────────────────
  const total = cur.pages.length;
  if (total > 1) {
    cur.pages.forEach((p, i) => {
      const label = `Halaman ${i + 1} dari ${total}`;
      p.drawText(label, {
        x: width / 2 - fontTimes.widthOfTextAtSize(label, 7) / 2,
        y: 30,
        size: 7,
        font: fontTimes,
        color: rgb(0.4, 0.4, 0.4),
      });
    });
  }

  if (activeSignature) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cipansor.or.id';
    const verifyUrlText = `Verifikasi keaslian: ${siteUrl.replace(/\/$/, '')}/public/verify-letter`;
    cur.pages[total - 1].drawText(verifyUrlText, {
      x: MARGIN_X,
      y: 30,
      size: 7,
      font: fontTimesItalic,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Cap "DICABUT" pada salinan naskah yang sudah dicabut.
 *
 * Bukan menolak mencetaknya. Kantor tetap perlu mengarsipkan salinannya, dan
 * penerima yang sudah memegang surat itu berhak mendapat lembar yang menjelaskan
 * dirinya sendiri; platform tanda tangan elektronik pun begitu — DocuSign
 * membubuhkan watermark VOID dan tetap membiarkan dokumennya diunduh.
 *
 * Yang dibubuhkan cap adalah **salinan**, bukan berkas yang ditandatangani.
 * Pemanggilnya wajib lebih dulu membuktikan bahwa naskah yang dihasilkan ulang
 * masih sama persis dengan yang di-hash saat penandatanganan (lihat
 * `correspondence.controller.ts`), sehingga salinan yang telanjur beredar tetap
 * terverifikasi dan tetap dilaporkan sebagai dicabut, bukan sebagai palsu.
 */
export async function stampRevoked(
  pdfBuffer: Buffer,
  revocation: { reason: string; revokedAt: Date; revokedByName?: string | null }
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  const stampedOn = revocation.revokedAt.toISOString().slice(0, 10);
  const foot = sanitizeForWinAnsi(
    `DICABUT ${stampedOn}${revocation.revokedByName ? ` oleh ${revocation.revokedByName}` : ''} — ${revocation.reason}`
  );

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    const label = 'DICABUT';
    const size = 92;
    const textWidth = bold.widthOfTextAtSize(label, size);

    // Melintang, di belakang teksnya, cukup pucat untuk tetap terbaca isinya
    // dan cukup jelas untuk tidak mungkin terlewat.
    page.drawText(label, {
      x: width / 2 - (textWidth * Math.cos(Math.PI / 6)) / 2,
      y: height / 2 - (textWidth * Math.sin(Math.PI / 6)) / 2,
      size,
      font: bold,
      color: rgb(0.85, 0.35, 0.25),
      opacity: 0.22,
      rotate: degrees(30),
    });

    // Keterangan kaki: watermark mengatakan "dicabut", baris ini mengatakan
    // sejak kapan dan mengapa — yang justru dicari pembacanya.
    const footSize = 7;
    let line = foot;
    while (italic.widthOfTextAtSize(line, footSize) > width - 2 * 40 && line.length > 12) {
      line = `${line.slice(0, -4)}…`;
    }
    page.drawText(line, {
      x: 40,
      y: 18,
      size: footSize,
      font: italic,
      color: rgb(0.7, 0.2, 0.15),
    });
  }

  pdfDoc.setCreationDate(new Date(0));
  pdfDoc.setModificationDate(new Date(0));
  return Buffer.from(await pdfDoc.save());
}
