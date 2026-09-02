import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

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

export async function generateLetterPdfBuffer(letter: LetterPdfInput): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  // Fix dates to Epoch 0 for byte determinism
  pdfDoc.setCreationDate(new Date(0));
  pdfDoc.setModificationDate(new Date(0));
  pdfDoc.setTitle(`Surat ${letter.letterNumber || letter.agendaNumber || 'Draft'}`);
  pdfDoc.setProducer('Cipansor E-Office');
  pdfDoc.setCreator('Cipansor E-Office');

  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontTimesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  let y = height - 40;

  // Header / Kop Surat
  const orgName = 'YAYASAN PESANTREN CIPANSOR';
  const unitName = letter.unit?.name?.toUpperCase() ?? 'KANTOR YAYASAN';
  const legalBasis = 'SK Kemenkumham RI No. AHU-0012345.AH.01.04.Tahun 2020';
  const address = letter.unit?.address ?? 'Jl. Raya Cipansor No. 01, Tasikmalaya, Jawa Barat';
  const contact = `Website: cipansor.or.id | Telp: ${letter.unit?.phone || '0265-123456'} | Email: ${letter.unit?.email || 'halo@cipansor.or.id'}`;

  page.drawText(orgName, {
    x: width / 2 - fontTimesBold.widthOfTextAtSize(orgName, 12) / 2,
    y,
    size: 12,
    font: fontTimesBold,
    color: rgb(0, 0, 0),
  });
  y -= 16;

  page.drawText(unitName, {
    x: width / 2 - fontTimesBold.widthOfTextAtSize(unitName, 14) / 2,
    y,
    size: 14,
    font: fontTimesBold,
    color: rgb(0, 0, 0),
  });
  y -= 14;

  page.drawText(legalBasis, {
    x: width / 2 - fontTimesItalic.widthOfTextAtSize(legalBasis, 8) / 2,
    y,
    size: 8,
    font: fontTimesItalic,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 12;

  page.drawText(address, {
    x: width / 2 - fontTimes.widthOfTextAtSize(address, 8) / 2,
    y,
    size: 8,
    font: fontTimes,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 12;

  page.drawText(contact, {
    x: width / 2 - fontTimes.widthOfTextAtSize(contact, 8) / 2,
    y,
    size: 8,
    font: fontTimes,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 14;

  // Double Line
  page.drawLine({
    start: { x: 40, y },
    end: { x: width - 40, y },
    thickness: 2,
    color: rgb(0, 0, 0),
  });
  y -= 4;
  page.drawLine({
    start: { x: 40, y },
    end: { x: width - 40, y },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });
  y -= 25;

  // Metadata block
  const dateStr = new Date(letter.date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
  const numberStr = letter.letterNumber || letter.agendaNumber || 'DRAFT';

  page.drawText(`Nomor     : ${numberStr}`, { x: 40, y, size: 10, font: fontTimes });
  page.drawText(`Tasikmalaya, ${dateStr}`, {
    x: width - 180,
    y,
    size: 10,
    font: fontTimes,
  });
  y -= 14;

  page.drawText(`Lampiran : -`, { x: 40, y, size: 10, font: fontTimes });
  y -= 14;

  page.drawText(`Perihal   : ${letter.subject}`, {
    x: 40,
    y,
    size: 10,
    font: fontTimesBold,
  });
  y -= 25;

  // Recipient block
  const recipient = letter.recipientName || letter.recipientInstance || 'Bapak/Ibu';
  page.drawText('Kepada Yth.', { x: 40, y, size: 10, font: fontTimes });
  y -= 14;
  page.drawText(recipient, { x: 40, y, size: 10, font: fontTimesBold });
  y -= 14;
  page.drawText('di Tempat', { x: 40, y, size: 10, font: fontTimes });
  y -= 30;

  // Content Paragraphs with Wrapping
  const paragraphs = (letter.content || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const wrapText = (text: string, maxWidth: number, font: any, fontSize: number): string[] => {
    const words = text.split(/\s+/);
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
  };

  const contentMaxWidth = width - 80;
  for (const para of paragraphs) {
    const lines = wrapText(para, contentMaxWidth, fontTimes, 10);
    for (const line of lines) {
      if (y < 120) break; // stay within page
      page.drawText(line, { x: 40, y, size: 10, font: fontTimes });
      y -= 14;
    }
    y -= 8;
  }

  // Signature Block
  y = Math.min(y - 20, 220);
  const activeSignature = (letter.signatures || []).filter((s) => !s.revokedAt).slice(-1)[0];

  const rightAlignX = width - 220;
  page.drawText(`Tasikmalaya, ${dateStr}`, { x: rightAlignX, y, size: 10, font: fontTimes });
  y -= 14;
  page.drawText('Yayasan Pesantren Cipansor', {
    x: rightAlignX,
    y,
    size: 10,
    font: fontTimesBold,
  });
  y -= 14;

  if (letter.senderTitle) {
    page.drawText(letter.senderTitle, { x: rightAlignX, y, size: 10, font: fontTimes });
    y -= 14;
  }

  if (activeSignature) {
    // Generate QR Code image
    const qrBuffer = await QRCode.toBuffer(activeSignature.verificationToken, {
      type: 'png',
      margin: 1,
      width: 150,
    });
    const qrImage = await pdfDoc.embedPng(qrBuffer);

    page.drawImage(qrImage, {
      x: rightAlignX + 20,
      y: y - 65,
      width: 65,
      height: 65,
    });
    y -= 72;

    page.drawText('Ditandatangani secara elektronik', {
      x: rightAlignX,
      y,
      size: 7,
      font: fontTimesItalic,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 10;

    const signedAtStr = `${new Date(activeSignature.signedAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    })} WIB`;

    page.drawText(signedAtStr, {
      x: rightAlignX,
      y,
      size: 7,
      font: fontTimesItalic,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 14;
  } else {
    y -= 50; // space for physical signature
  }

  const signerName =
    activeSignature?.signer?.name || letter.senderName || '.........................';
  const signerNip =
    activeSignature?.signer?.teacher?.nip || activeSignature?.signer?.staff?.nip || '-';

  page.drawText(signerName, {
    x: rightAlignX,
    y,
    size: 10,
    font: fontTimesBold,
  });
  y -= 12;

  if (signerNip !== '-') {
    page.drawText(`NIP. ${signerNip}`, {
      x: rightAlignX,
      y,
      size: 9,
      font: fontTimes,
    });
    y -= 12;
  }

  if (activeSignature) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cipansor.or.id';
    const verifyUrlText = `Verifikasi keaslian: ${siteUrl.replace(/\/$/, '')}/public/verify-letter`;
    page.drawText(verifyUrlText, {
      x: 40,
      y: 30,
      size: 7,
      font: fontTimesItalic,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
