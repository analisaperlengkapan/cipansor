import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Kunci tanda tangan elektronik milik pengguna dan alur pengajuannya.
 *
 * Passphrase tidak pernah disimpan di sisi klien — tidak di state yang
 * bertahan, tidak di localStorage. Ia hanya ada di dalam field formulir selama
 * pengiriman, lalu ikut hilang bersama komponennya. Menyimpannya "agar tidak
 * perlu mengetik lagi" akan meniadakan seluruh alasan passphrase ini dipisah
 * dari password akun.
 */

export type SigningKeyState =
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "REVOKED";

export interface EsignStatus {
  hasKey: boolean;
  state: SigningKeyState | null;
  expiresAt: string | null;
  daysUntilExpiry: number | null;
  revokedReason: string | null;
  lockedUntil: string | null;
  lastUsedAt: string | null;
  canRequestRenewal: boolean;
  needsNewIssuance: boolean;
  pendingRequest: { id: string; kind: string; createdAt: string } | null;
}

export function useEsign() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["esign", "me"] });
  };

  const status = useQuery<EsignStatus>({
    queryKey: ["esign", "me"],
    queryFn: async () => (await api.get("/esign/me")).data.data,
  });

  const requestKey = useMutation({
    mutationFn: async (reason?: string) =>
      (await api.post("/esign/me/request", { reason })).data.data,
    onSuccess: invalidate,
  });

  const activate = useMutation({
    mutationFn: async (passphrase: string) =>
      (await api.post("/esign/me/activate", { passphrase })).data.data,
    onSuccess: invalidate,
  });

  const changePassphrase = useMutation({
    mutationFn: async (input: {
      currentPassphrase: string;
      accountPassword: string;
      newPassphrase: string;
    }) => (await api.post("/esign/me/passphrase", input)).data.data,
    onSuccess: invalidate,
  });

  return { status, requestKey, activate, changePassphrase };
}

/** Antrean pengajuan — hanya Super Admin yang dilayani server. */
export function useEsignRequests(status?: "PENDING" | "APPROVED" | "REJECTED") {
  const queryClient = useQueryClient();

  const requests = useQuery({
    queryKey: ["esign", "requests", status],
    queryFn: async () =>
      (await api.get("/esign/requests", { params: { status } })).data.data,
  });

  const decide = useMutation({
    mutationFn: async (input: {
      id: string;
      approve: boolean;
      grantedDays?: number;
      note?: string;
    }) => {
      const { id, ...body } = input;
      return (await api.post(`/esign/requests/${id}/decide`, body)).data.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["esign", "requests"] }),
  });

  return { requests, decide };
}

/** Satu kunci dalam daftar Super Admin. */
export interface EsignKeyRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  roleCode: string | null;
  position: string | null;
  unitName: string | null;
  algorithm: string;
  state: SigningKeyState;
  approvedAt: string | null;
  approvedByName: string | null;
  expiresAt: string | null;
  daysUntilExpiry: number | null;
  lastUsedAt: string | null;
  lockedUntil: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  revokedByName: string | null;
  createdAt: string;
}

/** Satu surat yang masih sah walaupun kuncinya baru saja dicabut. */
export interface AffectedLetter {
  signatureId: string;
  letterId: string;
  letterNumber: string | null;
  subject: string | null;
  date: string;
  signedAt: string;
}

/** Sebab pencabutan kunci, mengikuti RFC 5280 §5.3.1. */
export type SigningKeyRevocationCode =
  | "KEY_COMPROMISE"
  | "AFFILIATION_CHANGED"
  | "SUPERSEDED"
  | "CESSATION_OF_OPERATION"
  | "PRIVILEGE_WITHDRAWN";

export const REVOCATION_CODE_LABEL: Record<SigningKeyRevocationCode, string> = {
  KEY_COMPROMISE: "Passphrase atau kunci diduga bocor",
  AFFILIATION_CHANGED: "Berhenti menjabat / wewenang dicabut",
  SUPERSEDED: "Diterbitkan ulang, digantikan kunci baru",
  CESSATION_OF_OPERATION: "Tidak dipakai lagi",
  PRIVILEGE_WITHDRAWN: "Kekeliruan penerbitan",
};

export interface RevokeKeyResult {
  success: boolean;
  revokedAt: string;
  revokedReason: string;
  revocationCode: SigningKeyRevocationCode;
  /** Hanya kebocoran kunci yang membuat surat-surat lama perlu ditinjau. */
  lettersNeedReview: boolean;
  affectedLetterCount: number;
  affectedLetters: AffectedLetter[];
}

/**
 * Daftar pemegang kunci dan pencabutannya — hanya Super Admin yang dilayani
 * server.
 *
 * Daftarnya ada karena pencabutan menuntutnya: rutenya sudah lama tersedia,
 * tetapi tanpa daftar ini tidak ada satu pun tempat di dalam aplikasi yang
 * menyebutkan siapa saja pemegang kunci.
 */
export function useEsignKeys() {
  const queryClient = useQueryClient();

  const keys = useQuery<EsignKeyRow[]>({
    queryKey: ["esign", "keys"],
    queryFn: async () => (await api.get("/esign/keys")).data.data,
  });

  const revokeKey = useMutation<
    RevokeKeyResult,
    unknown,
    { userId: string; reason: string; code: SigningKeyRevocationCode }
  >({
    mutationFn: async ({ userId, reason, code }) =>
      (await api.post(`/esign/keys/${userId}/revoke`, { reason, code })).data.data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["esign", "keys"] });
      queryClient.invalidateQueries({ queryKey: ["esign", "me"] });
    },
  });

  return { keys, revokeKey };
}

/**
 * Mencabut naskah dinas.
 *
 * Menuntut passphrase, sama seperti menandatangani — dan passphrase yang diminta
 * adalah milik **pencabutnya**, bukan milik penandatangan. Dua sebabnya: menarik
 * surat resmi tidak boleh cukup dengan sesi yang tertinggal terbuka, dan
 * pernyataan pencabutannya ditandatangani supaya halaman verifikasi publik dapat
 * membuktikannya (sebuah CRL pun ditandatangani penerbitnya — RFC 5280).
 */
export function useRevokeLetter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { letterId: string; reason: string; passphrase: string }) =>
      (
        await api.post(`/esign/letters/${input.letterId}/revoke`, {
          reason: input.reason,
          passphrase: input.passphrase,
        })
      ).data.data,
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["letters"] });
      queryClient.invalidateQueries({ queryKey: ["letter", v.letterId] });
    },
  });
}

/**
 * Mengajukan pencabutan kepada yang berwenang.
 *
 * Tidak menuntut passphrase: tidak ada yang berubah pada suratnya sampai
 * permohonannya diputuskan. Terbuka bagi siapa pun yang boleh membaca suratnya,
 * karena yang paling mungkin lebih dulu menemukan nomor surat ganda adalah
 * petugas tata usaha — bukan pejabat yang berwenang mencabutnya.
 */
export function useRequestRevocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      letterId: string;
      reason: string;
      attachmentUrl?: string;
    }) =>
      (
        await api.post(`/esign/letters/${input.letterId}/revocation-requests`, {
          reason: input.reason,
          attachmentUrl: input.attachmentUrl,
        })
      ).data.data,
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["letter", v.letterId] });
    },
  });
}

/** Memutuskan permohonan — menyetujui berarti mencabut, di sini dan sekarang. */
export function useDecideRevocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      requestId: string;
      letterId: string;
      approve: boolean;
      note?: string;
      passphrase?: string;
      reason?: string;
    }) => {
      const { requestId, letterId: _letterId, ...body } = input;
      return (await api.post(`/esign/revocation-requests/${requestId}/decide`, body)).data.data;
    },
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["letters"] });
      queryClient.invalidateQueries({ queryKey: ["letter", v.letterId] });
    },
  });
}

export function useWithdrawRevocationRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { requestId: string; letterId: string }) =>
      (await api.post(`/esign/revocation-requests/${input.requestId}/withdraw`)).data.data,
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["letter", v.letterId] });
    },
  });
}

/** Membubuhkan tanda tangan pada surat yang sudah sampai giliran penandatangan. */
export function useSignLetter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { letterId: string; passphrase: string }) =>
      (
        await api.post(`/esign/letters/${input.letterId}/sign`, {
          passphrase: input.passphrase,
        })
      ).data.data,
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["letters"] });
      queryClient.invalidateQueries({ queryKey: ["letter", v.letterId] });
    },
  });
}
