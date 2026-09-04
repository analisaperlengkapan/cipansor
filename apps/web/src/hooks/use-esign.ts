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

/** Membubuhkan tanda tangan pada surat yang sudah sampai giliran penandatangan. */
export function useSignLetter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { letterId: string; passphrase: string; pdfFile?: Blob | File }) => {
      if (input.pdfFile) {
        const formData = new FormData();
        formData.append("passphrase", input.passphrase);
        formData.append("file", input.pdfFile);
        return (
          await api.post(`/esign/letters/${input.letterId}/sign`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
        ).data.data;
      }
      return (
        await api.post(`/esign/letters/${input.letterId}/sign`, {
          passphrase: input.passphrase,
        })
      ).data.data;
    },
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["letters"] });
      queryClient.invalidateQueries({ queryKey: ["letter", v.letterId] });
    },
  });
}
