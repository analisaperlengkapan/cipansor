import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display hero section with main title", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Membangun Generasi Qur'ani" }),
    ).toBeVisible();
    // Scope to hero section
    const hero = page.locator("#hero");
    await expect(
      hero.getByRole("link", { name: "Daftar Sekarang" }),
    ).toBeVisible();
  });

  test("should display navigation menu", async ({ page, isMobile }) => {
    if (!isMobile) {
      const nav = page.locator("header");
      await expect(nav.getByRole("link", { name: "Beranda" })).toBeVisible();
      await expect(
        nav.getByRole("link", { name: "Tentang Kami" }),
      ).toBeVisible();
      // Use exact: true to avoid matching "Program Pendidikan"
      await expect(
        nav.getByRole("link", { name: "Program", exact: true }),
      ).toBeVisible();
      await expect(nav.getByRole("link", { name: "Statistik" })).toBeVisible();
    } else {
      await expect(
        page.getByRole("button", { name: "Toggle menu" }),
      ).toBeVisible();
    }
  });

  test("should navigate to login page", async ({ page, isMobile }) => {
    if (isMobile) {
      await page.getByRole("button", { name: "Toggle menu" }).click();
    }

    // Use exact to avoid matching other things or scope to header/sheet
    await page.getByRole("link", { name: "Login Portal" }).click();
    await expect(page).toHaveURL(/.*login/);
  });

  test("should navigate to PPDB page", async ({ page, isMobile }) => {
    // Use the Hero button for reliability across mobile/desktop
    const hero = page.locator("#hero");
    const ppdbButton = hero.getByRole("link", { name: "Daftar Sekarang" });

    await ppdbButton.click();
    await expect(page).toHaveURL(/.*ppdb/);
  });

  test("should display stats section", async ({ page }) => {
    const stats = page.locator("#stats");
    await expect(stats.getByText("Santri", { exact: true })).toBeVisible();
    await expect(stats.getByText("Alumni", { exact: true })).toBeVisible();
    // Fix: verify first element or use locator properly
    await expect(stats.getByText("Pengajar").first()).toBeVisible();
  });

  test("should display programs section", async ({ page }) => {
    const programs = page.locator("#programs");
    await expect(
      programs.getByRole("heading", { name: "Jenjang Pendidikan" }),
    ).toBeVisible();
    await expect(programs.getByText("TK Al-Qur'an")).toBeVisible();
    await expect(programs.getByText("SDIT Cipansor")).toBeVisible();
  });

  test("should display footer with contact info", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const footer = page.locator("footer");
    await expect(footer.getByText("Jl. Pesantren No. 123")).toBeVisible();

    // Verify Donasi link points to public page
    const donasiLink = footer.getByRole("link", {
      name: "Donasi",
      exact: true,
    });
    await expect(donasiLink).toBeVisible();
    await expect(donasiLink).toHaveAttribute("href", "/wakaf-infaq");
  });
});
