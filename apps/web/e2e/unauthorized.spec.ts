import { test, expect } from "@playwright/test";

// The /unauthorized page is where ProtectedRoute sends users who lack access.
// It is a public route (middleware allows it), so no auth setup is needed.
test.describe("Unauthorized (access denied) page", () => {
  test("renders the access-denied message and navigation actions", async ({
    page,
  }) => {
    await page.goto("/unauthorized");

    // Stays on /unauthorized (not bounced to /login or a dashboard by RBAC).
    await expect(page).toHaveURL(/\/unauthorized$/);

    await expect(page.getByText("Akses Ditolak")).toBeVisible();
    await expect(
      page.getByText("tidak memiliki izin untuk mengakses halaman ini"),
    ).toBeVisible();

    // Both recovery actions are present and point to the right routes.
    const dashboardLink = page.getByRole("link", { name: /Dashboard/i });
    const loginLink = page.getByRole("link", { name: /Login Ulang/i });
    await expect(dashboardLink).toBeVisible();
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute("href", "/login");
  });
});
