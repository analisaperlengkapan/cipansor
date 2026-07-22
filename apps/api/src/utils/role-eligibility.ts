import { RoleCode } from '@prisma/client';

/**
 * Rules about which roles a person may hold together, and what a role requires
 * of them.
 *
 * These live here, in the backend, because the backend is the only place a rule
 * cannot be walked around: the API is reachable without opening the web app at
 * all. The web app mirrors these for immediate feedback, but a disagreement
 * between the two is resolved in favour of this file. The organ rule is
 * additionally enforced by a database trigger, because bulk imports and manual
 * SQL repairs never pass through application code.
 */

/**
 * The three organs of a yayasan under UU No. 16/2001 jo. UU No. 28/2004.
 *
 * Pasal 29: "Anggota Pembina tidak boleh merangkap sebagai anggota Pengurus
 * dan/atau anggota Pengawas." Pasal 31 ayat (3) and Pasal 40 ayat (3) complete
 * the triangle for Pengurus and Pengawas. The separation is the whole point of
 * the structure — the organ that appoints cannot also be the organ that
 * executes or the organ that audits.
 *
 * This was not merely unenforced, it was violated by the seed:
 * ketua@cipansor.or.id held YAYASAN_KETUA (Pengurus) and YAYASAN_PEMBINA at
 * once.
 */
export type YayasanOrgan = 'PEMBINA' | 'PENGURUS' | 'PENGAWAS';

export const YAYASAN_ORGAN_BY_ROLE: Partial<Record<RoleCode, YayasanOrgan>> = {
  [RoleCode.YAYASAN_PEMBINA]: 'PEMBINA',
  // Pengurus is the executive organ: ketua, sekretaris, bendahara, and the
  // ordinary members who sit with them.
  [RoleCode.YAYASAN_KETUA]: 'PENGURUS',
  [RoleCode.YAYASAN_SEKRETARIS]: 'PENGURUS',
  [RoleCode.YAYASAN_BENDAHARA]: 'PENGURUS',
  [RoleCode.YAYASAN_ANGGOTA]: 'PENGURUS',
  [RoleCode.YAYASAN_PENGAWAS]: 'PENGAWAS',
};

export function yayasanOrganOf(roleCode: string): YayasanOrgan | undefined {
  return YAYASAN_ORGAN_BY_ROLE[roleCode as RoleCode];
}

/** Human-readable, because this message is shown to whoever is doing the entry. */
const ORGAN_LABEL: Record<YayasanOrgan, string> = {
  PEMBINA: 'Pembina',
  PENGURUS: 'Pengurus',
  PENGAWAS: 'Pengawas',
};

export interface OrganConflict {
  organ: YayasanOrgan;
  existingOrgan: YayasanOrgan;
  message: string;
}

/**
 * Reports the conflict when adding `incomingRole` to someone who already holds
 * `existingRoles`, or null when there is none.
 *
 * Holding two roles inside the *same* organ is fine — a Pengurus can be both
 * ketua and, in a small yayasan, treasurer. It is crossing organs that the law
 * forbids.
 */
export function findOrganConflict(
  incomingRole: string,
  existingRoles: string[]
): OrganConflict | null {
  const organ = yayasanOrganOf(incomingRole);
  if (!organ) return null;

  for (const held of existingRoles) {
    const heldOrgan = yayasanOrganOf(held);
    if (!heldOrgan || heldOrgan === organ) continue;

    return {
      organ,
      existingOrgan: heldOrgan,
      message:
        `${ORGAN_LABEL[organ]} yayasan tidak boleh merangkap sebagai ` +
        `${ORGAN_LABEL[heldOrgan]} (UU 16/2001 tentang Yayasan Pasal 29). ` +
        `Lepaskan peran ${ORGAN_LABEL[heldOrgan]} terlebih dahulu.`,
    };
  }

  return null;
}
