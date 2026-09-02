import { prisma } from '@/lib/prisma';
import { verifySignature } from '@/utils/esign';

export async function verifyLetterByToken(token: string) {
  const signature = await prisma.letterSignature.findUnique({
    where: { verificationToken: token },
    include: {
      signer: {
        select: {
          name: true,
          teacher: { select: { nip: true } },
          staff: { select: { nip: true, position: true } },
        },
      },
      letter: {
        select: {
          id: true,
          letterNumber: true,
          agendaNumber: true,
          date: true,
          type: true,
          nature: true,
          subject: true,
          content: true,
          status: true,
          unitId: true,
          unit: { select: { name: true } },
        },
      },
    },
  });

  if (!signature) {
    return { found: false as const };
  }

  const l = signature.letter;
  const intact = verifySignature(signature.publicKey, signature.signature, {
    letterId: l.id,
    letterNumber: l.letterNumber,
    date: l.date,
    type: l.type,
    nature: l.nature,
    subject: l.subject,
    content: l.content,
    unitId: l.unitId,
    signerId: signature.signerId,
    signedAt: signature.signedAt,
  });

  const isPublicNature = l.nature === 'PUBLIC';
  const isValid = intact && !signature.revokedAt;

  let reason: string | undefined;
  if (!intact) {
    reason = 'Isi naskah telah diubah setelah ditandatangani.';
  } else if (signature.revokedAt) {
    reason = signature.revokedReason ? `Surat telah dicabut: ${signature.revokedReason}` : 'Surat telah dicabut.';
  }

  return {
    found: true as const,
    valid: isValid,
    isValid,
    intact,
    revoked: !!signature.revokedAt,
    isRevoked: !!signature.revokedAt,
    revokedAt: signature.revokedAt,
    revokedReason: signature.revokedReason,
    letterNumber: l.letterNumber || l.agendaNumber || '-',
    letterType: l.type,
    nature: l.nature,
    // Hanya untuk surat biasa; selebihnya cukup dibuktikan keasliannya.
    subject: isPublicNature ? l.subject : null,
    date: l.date,
    unitName: l.unit?.name ?? null,
    signerName: signature.signer.name,
    signer: {
      name: signature.signer.name,
      nip: signature.signer.teacher?.nip || signature.signer.staff?.nip || '-',
      position: signature.signer.staff?.position || 'Pejabat / Guru Yayasan',
    },
    letter: {
      letterNumber: l.letterNumber || l.agendaNumber || '-',
      subject: isPublicNature ? l.subject : null,
      date: l.date,
      status: l.status,
      unitName: l.unit?.name ?? '-',
    },
    signedAt: signature.signedAt,
    algorithm: signature.algorithm,
    digest: signature.digest,
    reason,
  };
}
