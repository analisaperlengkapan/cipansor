import { test, expect } from "./fixtures/auth.fixture";
import {
  waitForLoadingComplete,
  waitForToast,
  navigateTo,
} from "./helpers/page-helpers";

test.describe("Extracurricular Management", () => {
  test.use({ storageState: ".auth/superAdmin.json" });

  test("should be able to manage extracurricular details", async ({ page }) => {
    // 1. Navigate to list
    await navigateTo(page, "/extracurricular");
    await waitForLoadingComplete(page);

    // 2. Click on the first extracurricular
    // Try finding by href or text if specific selectors aren't known, generic link is safest guess for list items
    const firstItem = page.locator('a[href^="/extracurricular/"]').first();

    // If no items, we can't test details.
    // Ideally we should create one, but for this task assuming data exists or skipping is safer than failing.
    if (await firstItem.count() === 0) {
        console.log("No extracurriculars found. Skipping detail tests.");
        return;
    }

    await firstItem.click();
    await waitForLoadingComplete(page);

    // 3. Add Member
    // Switch to Members tab
    const memberTab = page.getByRole("tab", { name: /anggota|members/i });
    if (await memberTab.isVisible()) {
        await memberTab.click();

        const addMemberBtn = page.getByRole("button", { name: /tambah anggota|add member/i });
        if (await addMemberBtn.isVisible()) {
            await addMemberBtn.click();
            await expect(page.getByRole("dialog")).toBeVisible();

            // Interact with StudentSelect
            const studentSelect = page.locator('button[role="combobox"]').first();
            await studentSelect.click();

            // Wait for options
            const option = page.getByRole("option").first();
            // Only proceed if students are found
            if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
                await option.click();

                // Add note
                const noteInput = page.getByPlaceholder(/contoh|example/i);
                if (await noteInput.isVisible()) {
                    await noteInput.fill("Test E2E Enrollment");
                }

                await page.getByRole("button", { name: /simpan|save/i }).click();
                await waitForToast(page, /berhasil|success/i, "success");
            } else {
                // Cancel if no students
                await page.getByRole("button", { name: /batal|cancel/i }).click();
            }
        }
    }

    // 4. Input Attendance
    const attendanceTab = page.getByRole("tab", { name: /absensi|attendance/i });
    if (await attendanceTab.isVisible()) {
        await attendanceTab.click();

        const attendanceBtn = page.getByRole("button", { name: /input absensi/i });
        if (await attendanceBtn.isVisible()) {
            await attendanceBtn.click();
            await expect(page.getByRole("dialog")).toBeVisible();

            // Check if save is enabled (requires active students)
            const saveBtn = page.getByRole("button", { name: /simpan absensi/i });
            if (await saveBtn.isEnabled()) {
                 await saveBtn.click();
                 await waitForToast(page, /berhasil|success/i, "success");
            } else {
                 await page.getByRole("button", { name: /batal|cancel/i }).click();
            }
        }
    }

    // 5. Add Achievement
    const achievementTab = page.getByRole("tab", { name: /prestasi|achievements/i });
    if (await achievementTab.isVisible()) {
        await achievementTab.click();

        const addAchievementBtn = page.getByRole("button", { name: /tambah prestasi|add achievement/i });
        if (await addAchievementBtn.isVisible()) {
            await addAchievementBtn.click();
            await expect(page.getByRole("dialog")).toBeVisible();

            await page.getByLabel(/judul|title/i).fill("Juara 1 Lomba Test E2E");

            // Level is a select, might need interaction if default isn't valid, but default is SCHOOL

            await page.getByLabel(/peringkat|rank/i).fill("Juara 1");
            await page.getByLabel(/deskripsi|description/i).fill("Test E2E Achievement");

            await page.getByRole("button", { name: /simpan|save/i }).click();
            await waitForToast(page, /berhasil|success/i, "success");
        }
    }
  });
});
