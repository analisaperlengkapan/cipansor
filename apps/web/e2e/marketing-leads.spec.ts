import { test, expect } from "@playwright/test";

test.describe("Marketing - Lead Management", () => {

  test.beforeEach(async ({ page }) => {
    // Mock Auth
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            id: "user-1",
            name: "Super Admin",
            role: "SUPER_ADMIN",
            email: "superadmin@cipansor.id",
          },
        },
      });
    });

    // Mock Login (if redirected)
    await page.route("**/api/auth/login", async (route) => {
        await route.fulfill({
            status: 200,
            json: {
                success: true,
                data: { accessToken: "mock-token", refreshToken: "mock-refresh" }
            }
        });
    });

    // Inject token
    await page.addInitScript(() => {
        localStorage.setItem("accessToken", "mock-token");
    });

    // Mock Campaigns GET
    await page.route("**/api/marketing/campaigns*", async (route) => {
        await route.fulfill({
            status: 200,
            json: {
                success: true,
                data: [{ id: "camp-1", name: "Campaign 1", code: "CAMP1" }]
            }
        });
    });
  });

  test("should create a new lead", async ({ page }) => {
    let leads = [];

    // Mock Leads API (List only)
    // Regex to match /leads or /leads?param=... but NOT /leads/id
    await page.route(/\/api\/marketing\/leads(\?.*)?$/, async (route) => {
        const method = route.request().method();
        if (method === "GET") {
            await route.fulfill({
                status: 200,
                json: {
                    success: true,
                    data: leads,
                    meta: { total: leads.length, page: 1, limit: 50, totalPages: 1 }
                }
            });
        } else if (method === "POST") {
            const data = route.request().postDataJSON();
            const newLead = {
                id: "lead-new",
                ...data,
                status: "NEW",
                createdAt: new Date().toISOString(),
                campaign: { id: "camp-1", name: "Campaign 1", code: "CAMP1" }
            };
            leads = [newLead]; // Update "DB"
            await route.fulfill({
                status: 201,
                json: {
                    success: true,
                    data: newLead
                }
            });
        } else {
            await route.continue();
        }
    });

    await page.goto("/marketing/leads");

    // Check title
    await expect(page.getByRole("heading", { name: "Manajemen Leads" })).toBeVisible();

    // Create Lead
    await page.getByRole("button", { name: "Lead Baru" }).click();

    await page.getByLabel("Nama Lengkap").fill("Test Lead E2E");
    await page.getByLabel("Nomor HP").fill("081234567890");

    // Select Source
    await page.locator('button[role="combobox"]').filter({ hasText: "Pilih sumber" }).click();
    await page.getByRole("option", { name: "WEBSITE" }).click();

    // Select Campaign
    await page.locator('button[role="combobox"]').filter({ hasText: "Pilih kampanye" }).click();
    await page.getByRole("option", { name: "Campaign 1" }).click();

    await page.getByRole("button", { name: "Simpan" }).click();

    // Verify
    await expect(page.getByText("Lead berhasil dibuat")).toBeVisible();
    await expect(page.getByText("Test Lead E2E")).toBeVisible();
  });

  test("should view lead detail and log interaction", async ({ page }) => {
    const lead = {
        id: "lead-1",
        name: "Detail Test Lead",
        phone: "081234567899",
        status: "NEW",
        source: "WEBSITE",
        createdAt: new Date().toISOString(),
        notes: "Some notes",
        campaign: { id: "camp-1", name: "Campaign 1" }
    };

    // Mock Leads List
    await page.route(/\/api\/marketing\/leads(\?.*)?$/, async (route) => {
         await route.fulfill({
            status: 200,
            json: {
                success: true,
                data: [lead],
                meta: { total: 1, page: 1, limit: 50, totalPages: 1 }
            }
        });
    });

    // Mock Single Lead
    await page.route(new RegExp(`/api/marketing/leads/${lead.id}$`), async (route) => {
        await route.fulfill({
            status: 200,
            json: {
                success: true,
                data: lead
            }
        });
    });

    // Mock Interactions List
    await page.route("**/api/marketing/interactions*", async (route) => {
        if (route.request().method() === "GET") {
             await route.fulfill({
                status: 200,
                json: {
                    success: true,
                    data: []
                }
            });
        } else if (route.request().method() === "POST") {
             await route.fulfill({
                status: 201,
                json: { success: true, data: {} }
            });
        }
    });

    await page.goto(`/marketing/leads/${lead.id}`);

    await expect(page.getByRole("heading", { name: "Detail Test Lead" })).toBeVisible();

    // Log Interaction
    await page.getByRole("button", { name: "Catat" }).click();
    await expect(page.getByRole("dialog", { name: "Catat Interaksi" })).toBeVisible();

    // Select Type (It defaults to WA, so searching for "Pilih tipe" fails)
    // We can just confirm WA is selected or change it
    // await page.getByLabel("Tipe").click(); // Try accessible label
    // Fallback to finding by value if label doesn't work in Shadcn/Radix sometimes
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "EMAIL" }).click();

    await page.getByLabel("Catatan").fill("Interaction test");
    await page.getByRole("button", { name: "Simpan" }).click();

    await expect(page.getByText("Interaksi berhasil dicatat")).toBeVisible();
  });
});
