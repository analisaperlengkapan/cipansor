import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Every in-app `href` must resolve to a real page.
 *
 * `rbac.test.ts` already asserts this for sidebar links. It does not cover the
 * links inside page bodies — buttons, table row actions, breadcrumbs — and
 * those had drifted badly: a Playwright sweep found dead links on most
 * modules, including ones the sidebar never touches. Next prefetches `<Link>`
 * targets, so a dead href costs a 404 round trip on every render of the page
 * that contains it, not only when someone clicks.
 *
 * The KNOWN_MISSING list below is a backlog, not an exemption: each entry is a
 * page that is linked but was never built. Delete entries as the pages land.
 * Anything NOT on the list fails this test, which is the point — the set can
 * shrink but must never grow.
 */

const WEB_SRC = path.join(__dirname, "..");
const APP_DIR = path.join(WEB_SRC, "app");

/** Linked but never built. Shrink this list; do not add to it. */
const KNOWN_MISSING = new Set([
  "/admissions/periods",
  "/admissions/periods/X",
  "/admissions/registrants",
  "/admissions/registrants/new",
  "/assessment/report-cards/X/edit",
  "/attendance/X",
  "/calendar/events/X",
  "/calendar/events/X/edit",
  "/curriculum/schedules",
  "/daily-report/X/edit",
  "/donation/X",
  "/donation/campaigns/X/edit",
  "/extracurricular/X/edit",
  "/finance/bills",
  "/finance/bills/X/pay",
  "/finance/invoices",
  "/homeroom/messages/new",
  "/hr/teachers/compliance/X",
  "/ibadah/records/X",
  "/ibadah/records/X/edit",
  "/ibadah/targets/X/edit",
  "/ibadah/targets/new",
  "/ibadah/verify",
  "/kitab-progress/X/assign",
  "/kitab-progress/X/edit",
  "/muhadatsah/X/edit",
  "/muhadhoroh/X/edit",
  "/muhasabah/X/edit",
  "/students/X/kitab",
  "/takhosus/enrollment/X/edit",
  "/takhosus/halaqoh/X/edit",
  "/takhosus/murojaah",
]);

/** Every route the App Router actually serves. */
function collectRoutes(dir: string, prefix = ""): Set<string> {
  const routes = new Set<string>();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Route groups and private folders do not appear in the URL.
      if (entry.name.startsWith("(") || entry.name.startsWith("_")) {
        for (const r of collectRoutes(full, prefix)) routes.add(r);
      } else if (!entry.name.startsWith("@")) {
        for (const r of collectRoutes(full, `${prefix}/${entry.name}`)) routes.add(r);
      }
    } else if (entry.name === "page.tsx" || entry.name === "route.ts") {
      routes.add(prefix || "/");
    }
  }
  return routes;
}

/** `X` stands in for an interpolated segment, so it matches any `[param]`. */
function routeExists(pathname: string, routes: Set<string>): boolean {
  if (routes.has(pathname)) return true;
  const wanted = pathname.split("/");
  for (const route of routes) {
    const actual = route.split("/");
    if (actual.length !== wanted.length) continue;
    const matches = actual.every(
      (segment, i) =>
        (segment.startsWith("[") && segment.endsWith("]")) || segment === wanted[i],
    );
    if (matches) return true;
  }
  return false;
}

function collectHrefs(dir: string): Map<string, Set<string>> {
  const found = new Map<string, Set<string>>();
  const walk = (current: string) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.tsx?$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) continue;

      const source = fs.readFileSync(full, "utf8");
      const pattern = /href=(?:"([^"]+)"|\{`([^`]+)`\})/g;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(source))) {
        let href = (match[1] ?? match[2]).replace(/\$\{[^}]*\}/g, "X");
        if (!href.startsWith("/")) continue;
        href = href.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
        // Static assets and API calls are not App Router pages.
        if (/\.\w{2,5}$/.test(href) || href.startsWith("/api/")) continue;

        const file = path.relative(WEB_SRC, full);
        found.set(href, (found.get(href) ?? new Set()).add(file));
      }
    }
  };
  walk(WEB_SRC);
  return found;
}

describe("in-app links", () => {
  const routes = collectRoutes(APP_DIR);
  const hrefs = collectHrefs(WEB_SRC);

  it("finds the App Router pages and the links between them", () => {
    expect(routes.size).toBeGreaterThan(300);
    expect(hrefs.size).toBeGreaterThan(200);
  });

  it("has no dead link that is not already a known gap", () => {
    const unexpected: string[] = [];
    for (const [href, files] of hrefs) {
      if (routeExists(href, routes)) continue;
      if (KNOWN_MISSING.has(href)) continue;
      unexpected.push(`${href}  (linked from ${[...files].join(", ")})`);
    }
    expect(unexpected.sort()).toEqual([]);
  });

  it("does not keep entries for pages that now exist", () => {
    const stale = [...KNOWN_MISSING].filter((href) => routeExists(href, routes));
    expect(stale.sort()).toEqual([]);
  });
});
