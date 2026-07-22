import { test, expect } from "@playwright/test";

/**
 * The landing header has broken twice in the same way, so it is pinned by
 * geometry rather than by asserting a class name.
 *
 * What makes it fragile: the row is a `justify-between` flex inside Tailwind's
 * `container`, which caps its width at the *active breakpoint* rather than the
 * viewport. Between 1024px and 1279px the row is 1024px wide however wide the
 * window is, so a breakpoint chosen by measuring at 1280px silently overflows
 * the whole band — the brand ends up underneath the first nav link.
 *
 * These tests therefore measure the rendered boxes: the brand must not touch
 * the nav, and the nav must not scroll inside itself.
 */

/** Widths where the desktop nav must be laid out, and why each is here. */
const DESKTOP_WIDTHS = [
  { width: 1024, note: "lg — container caps the row at 960px of content" },
  { width: 1152, note: "middle of the capped band" },
  { width: 1279, note: "last pixel before the container grows" },
  { width: 1280, note: "1920x1080 at 150% Windows scaling" },
  { width: 1265, note: "the same laptop once the scrollbar is counted" },
  { width: 1536, note: "2xl" },
  { width: 1920, note: "unscaled full HD" },
];

for (const { width, note } of DESKTOP_WIDTHS) {
  test(`landing header fits at ${width}px (${note})`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");

    const brand = page.locator("header a[href='/']").first();
    const nav = page.locator("header nav");

    await expect(nav).toBeVisible();

    const brandBox = await brand.boundingBox();
    const navBox = await nav.boundingBox();
    if (!brandBox || !navBox) throw new Error("header not laid out");

    // The gap may be small, but it must never be negative: a brand that
    // reaches past the nav's left edge is the overlap this guards against.
    expect(navBox.x).toBeGreaterThanOrEqual(brandBox.x + brandBox.width);

    // An overflowing nav scrolls internally instead of visibly colliding,
    // which is the quieter half of the same bug.
    const overflows = await nav.evaluate(
      (el) => el.scrollWidth > el.clientWidth + 1,
    );
    expect(overflows).toBe(false);
  });
}

test("hamburger replaces the nav below lg, and never doubles up", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1023, height: 800 });
  await page.goto("/");

  await expect(page.locator("header nav")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Toggle menu" }),
  ).toBeVisible();
});

test("desktop nav and hamburger are never shown together", async ({ page }) => {
  // Both visible means three flex items share the row, and justify-between
  // eats the gap between brand and nav without either one overflowing — how
  // the collision hid from a class-name assertion.
  for (const width of [1023, 1024, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");

    const navShown = await page.locator("header nav").isVisible();
    const burgerShown = await page
      .getByRole("button", { name: "Toggle menu" })
      .isVisible();

    expect(navShown).not.toBe(burgerShown);
  }
});
