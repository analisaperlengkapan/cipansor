/**
 * Which host serves which pages.
 *
 * The public site and the information system now live on separate hosts:
 *
 *   cipansor.or.id         — landing, profil, unit, berita, wakaf, kontak, verifikasi
 *   portal.cipansor.or.id  — login and everything behind it
 *
 * The split is enforced here rather than in nginx because the route table lives
 * in this codebase; nginx would have to be edited every time a page is added,
 * and the copy that drifts is the one that causes the outage.
 *
 * WHY SPLIT AT ALL. Whether a page is public is decided by `publicPrefixes` in
 * middleware.ts — a list maintained by hand. A page added under a new prefix
 * that nobody remembers to list bounces a prospective parent to the staff login
 * screen, which is what got the Ad Grants application rejected once already.
 * Serving the marketing site from a host that has no application on it makes
 * "public" the default there instead of something to remember.
 *
 * A CONSEQUENCE WORTH KNOWING. Sessions do not cross hosts: the token lives in
 * localStorage (per-origin) and the `auth-storage` cookie is host-only, with no
 * `domain=` attribute. So after the split the apex effectively only ever sees
 * signed-out visitors, and the portal holds the whole session. That is the
 * intended shape, and it is also why per-unit subdomains were rejected — a
 * bendahara holding roles in two units would have had to sign in twice.
 */

export const PUBLIC_HOST = "cipansor.or.id";
export const PORTAL_HOST = "portal.cipansor.or.id";

/**
 * Paths that belong to the public site. Kept in step with `publicPrefixes` in
 * middleware.ts — that list decides what may be read without a session, this
 * one decides which host serves it, and they describe the same set.
 */
export const PUBLIC_PATH_PREFIXES = [
  "/profil",
  "/program-unggulan",
  "/unit",
  "/berita",
  "/wakaf-infaq",
  "/kontak",
  /**
   * Where a letter's printed QR code points.
   *
   * This one is load-bearing in a way the others are not: the URLs are on paper
   * already, in the hands of dinas offices and wali santri. They must keep
   * resolving on the apex for as long as those letters exist, so `/verifikasi`
   * can never migrate to the portal.
   */
  "/verifikasi",
];

/** True when the request arrived on the portal, ignoring case and port. */
export function isPortalHost(host: string | null | undefined): boolean {
  return (host ?? "").split(":")[0].toLowerCase() === PORTAL_HOST;
}

/** Matches on segment boundaries, so "/unit" never also grants "/units". */
function underPublicPrefix(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * The host a request should be answered from, or `null` to answer it here.
 *
 * Returns `null` for any host that is not one of the two production names —
 * localhost, preview deployments and the container's own healthcheck all keep
 * today's single-host behaviour, so `pnpm dev` is unaffected.
 */
export function hostSplitTargetFor(
  host: string | null | undefined,
  pathname: string,
): string | null {
  // Strip the port: `localhost:3000` and a Host header carrying one must still
  // compare cleanly against the bare names above.
  const name = (host ?? "").split(":")[0].toLowerCase();

  const isPortal = name === PORTAL_HOST;
  const isPublic = name === PUBLIC_HOST || name === `www.${PUBLIC_HOST}`;
  if (!isPortal && !isPublic) return null;

  const isPublicPath = pathname === "/" || underPublicPrefix(pathname);

  // The application asked for on the public host — send it to the portal. The
  // portal's own auth check then takes over, so an anonymous visitor following
  // a bookmarked /dashboard link lands on the portal's login screen with the
  // original path preserved as ?redirect=, not on a dead end.
  if (isPublic && !isPublicPath) return PORTAL_HOST;

  // Marketing pages asked for on the portal — send them to the canonical host,
  // so there is one indexable address per page rather than two.
  //
  // "/" is deliberately excluded: on the portal the root is the way in to the
  // application, and middleware.ts turns it into the dashboard or the login
  // screen. Redirecting it to the apex would strand anyone who typed the portal
  // name on the marketing site instead.
  if (isPortal && pathname !== "/" && isPublicPath) return PUBLIC_HOST;

  return null;
}
