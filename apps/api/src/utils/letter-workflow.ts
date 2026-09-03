import { LetterStatus } from '@prisma/client';

/**
 * The rules that decide whether a letter may move, kept apart from the code
 * that moves it.
 *
 * Verification of an outgoing draft is *berjenjang* — tiered. Reviewers are
 * created with an `order`, the last one being the signer, and the intended
 * reading is that a draft climbs the ladder one rung at a time: tata usaha
 * drafts it, the sekretaris parafs, then the ketua signs. Nothing enforced
 * that. `processReview` looked the caller up by (letterId, reviewerId) and
 * acted, so the signer could sign a draft the sekretaris had never seen, and
 * the `order` column was decoration.
 *
 * The second gap was worse, because it left letters stuck. Rejecting set the
 * letter to REVISION_NEEDED and nothing else: the earlier reviewers kept their
 * APPROVED rows, and there was no route back into review. A returned draft
 * could not be resubmitted at all, and if it somehow were, everyone above the
 * rejector would still be holding an approval of a document they had not read
 * since it changed.
 */

export interface ReviewerRung {
  id: string;
  reviewerId: string;
  order: number;
  status: string;
  isSigner: boolean;
}

/** Statuses in which a draft is open for verification. */
const OPEN_FOR_REVIEW: readonly LetterStatus[] = [
  LetterStatus.PENDING_REVIEW,
  LetterStatus.READY_TO_SIGN,
];

export class WorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowError';
  }
}

/**
 * The rung whose turn it is: the lowest `order` not yet approved.
 *
 * Returns null when every rung has approved — there is nothing left to do, and
 * the caller must not treat that as "anyone may act".
 */
export function nextRung(reviewers: readonly ReviewerRung[]): ReviewerRung | null {
  const pending = reviewers
    .filter((r) => r.status !== 'APPROVED')
    .sort((a, b) => a.order - b.order);
  return pending[0] ?? null;
}

/**
 * May this reviewer act on this letter right now?
 *
 * Throws rather than returning false so the reason reaches the operator: "not
 * your turn" and "this letter is already signed" are different problems and a
 * boolean flattens them into the same unhelpful 403.
 */
export function assertMayReview(
  letterStatus: LetterStatus,
  reviewers: readonly ReviewerRung[],
  reviewerId: string
): ReviewerRung {
  if (!OPEN_FOR_REVIEW.includes(letterStatus)) {
    throw new WorkflowError(
      `Surat berstatus ${letterStatus} tidak sedang dalam tahap verifikasi.`
    );
  }

  const mine = reviewers.find((r) => r.reviewerId === reviewerId);
  if (!mine) {
    throw new WorkflowError('Anda tidak terdaftar sebagai verifikator surat ini.');
  }
  if (mine.status === 'APPROVED') {
    throw new WorkflowError('Anda sudah menyetujui surat ini.');
  }

  const turn = nextRung(reviewers);
  if (turn && turn.reviewerId !== reviewerId) {
    // Naming the rung ahead is the difference between "you may not" and "not
    // yet, and here is who we are waiting for".
    throw new WorkflowError(
      `Belum giliran Anda. Menunggu verifikator urutan ${turn.order} terlebih dahulu.`
    );
  }

  return mine;
}

/**
 * The letter's status after an approval, given who just approved.
 *
 * The signer's approval signs the letter. Anyone else's advances it to the
 * next rung, and READY_TO_SIGN is used once the only rung left is the signer —
 * so the state itself says what the letter is waiting for.
 */
export function statusAfterApproval(
  reviewers: readonly ReviewerRung[],
  approvedId: string
): LetterStatus {
  const after = reviewers.map((r) =>
    r.reviewerId === approvedId ? { ...r, status: 'APPROVED' } : r
  );
  const turn = nextRung(after);

  if (!turn) return LetterStatus.SIGNED;
  return turn.isSigner ? LetterStatus.READY_TO_SIGN : LetterStatus.PENDING_REVIEW;
}

/**
 * May the author send a returned draft back up the ladder?
 *
 * Only from REVISION_NEEDED, and only the author: a reviewer who could
 * resubmit could clear their own rejection.
 */
export function assertMayResubmit(
  letterStatus: LetterStatus,
  createdById: string,
  actorId: string
): void {
  if (letterStatus !== LetterStatus.REVISION_NEEDED) {
    throw new WorkflowError(
      'Hanya surat yang dikembalikan untuk revisi yang dapat diajukan ulang.'
    );
  }
  if (createdById !== actorId) {
    throw new WorkflowError('Hanya pembuat surat yang dapat mengajukan ulang.');
  }
}

/**
 * Resubmission clears every approval, not only those below the rejector.
 *
 * A paraf is an approval of a specific text. Once the text changes, an
 * approval given before the change no longer says anything about the document
 * being sent — keeping it would let a revised letter reach the signer carrying
 * consent nobody gave to this version. Cheaper to re-collect a paraf than to
 * send a letter the sekretaris never agreed to.
 */
export function statusAfterResubmit(reviewers: readonly ReviewerRung[]): LetterStatus {
  const fresh = reviewers.map((r) => ({ ...r, status: 'PENDING' }));
  const turn = nextRung(fresh);
  if (!turn) return LetterStatus.READY_TO_SIGN;
  return turn.isSigner ? LetterStatus.READY_TO_SIGN : LetterStatus.PENDING_REVIEW;
}

/** Terminal states — an archived letter is done, and stays done. */
const ALREADY_CLOSED: readonly LetterStatus[] = [LetterStatus.ARCHIVED];

/**
 * May this letter be archived?
 *
 * Archiving is what ends an incoming letter's journey: the last official to
 * receive a disposition closes it. Deliberately not restricted to the last
 * disposition recipient alone — a letter that needs no disposition at all
 * would then have no one able to close it, which is how the previous version
 * left every letter's status stuck at whatever it was created with.
 */
export function assertMayArchive(letterStatus: LetterStatus): void {
  if (ALREADY_CLOSED.includes(letterStatus)) {
    throw new WorkflowError('Surat ini sudah diarsipkan.');
  }
  if (letterStatus === LetterStatus.DRAFT) {
    throw new WorkflowError(
      'Konsep surat tidak dapat diarsipkan; selesaikan atau batalkan konsepnya terlebih dahulu.'
    );
  }
}
