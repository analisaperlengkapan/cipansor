import { DEMO_ACCOUNTS } from "@cipansor/shared";

// Demo accounts carry a photo for the handful of real, public leaders. The
// User record has no avatar column, so the app shell (header + sidebar) looks
// the photo up by the logged-in email. Non-demo users simply fall back to the
// name initial.
const photoByEmail = new Map<string, string>(
  DEMO_ACCOUNTS.filter((a) => a.photo).map((a) => [a.email, a.photo as string]),
);

export function demoPhotoForEmail(email?: string | null): string | undefined {
  if (!email) return undefined;
  return photoByEmail.get(email);
}
