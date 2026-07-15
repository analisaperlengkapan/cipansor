import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth-api";

// Primary module landing pages (static routes) most likely to be hit by users
// and covered by the suite. The sweep flags any that crash to the error boundary
// or throw a runtime error.
const ROUTES = [
  "/dashboard",
  "/students",
  "/teachers",
  "/classes",
  "/academic-years",
  "/attendance",
  "/attendance/calendar",
  "/announcements",
  "/alumni",
  "/assessment",
  "/assessment/report-cards",
  "/assignments",
  "/calendar",
  "/calendar/events",
  "/curriculum",
  "/finance",
  "/finance/accounting",
  "/donation",
  "/dormitories",
  "/extracurricular",
  "/facilities",
  "/counseling",
  "/canteen",
  "/cbt",
  "/certificates",
  "/admissions",
  "/analytics",
  "/users",
  "/roles",
  "/units",
  "/foundation",
  "/daily-report",
  "/duty-roster",
  "/emis",
  "/e-office",
];

test("crash sweep: no module landing page hits the error boundary", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await loginAs(page, "superAdmin");

  const broken: string[] = [];
  for (const route of ROUTES) {
    const pageErrors: string[] = [];
    const onErr = (e: Error) => {
      // WebKit surfaces aborted RSC/Link prefetches as page errors
      // ("Fetch API cannot load ... due to access control checks",
      // "Load failed") — navigation noise, not app crashes.
      if (/access control checks|load failed/i.test(e.message)) return;
      pageErrors.push(e.message);
    };
    page.on("pageerror", onErr);
    await page.goto(route, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(1500);
    const body = await page.locator("body").innerText().catch(() => "");
    const crashed =
      /Terjadi Kesalahan|Something went wrong|Invalid time value|Application error/i.test(
        body,
      ) || pageErrors.length > 0;
    if (crashed) {
      const reason = pageErrors[0] || body.match(/[A-Z][a-z]+Error[^|]*/)?.[0] || "error boundary";
      broken.push(`${route} → ${reason.slice(0, 80)}`);
    }
    page.off("pageerror", onErr);
  }

  console.log(
    broken.length
      ? `BROKEN (${broken.length}/${ROUTES.length}):\n` + broken.join("\n")
      : `All ${ROUTES.length} routes OK`,
  );
  expect(broken, broken.join("\n")).toEqual([]);
});
