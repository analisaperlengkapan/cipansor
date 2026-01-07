import asyncio
import json
import os
from playwright.async_api import async_playwright, expect

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            base_url="http://localhost:3000"
        )

        # --- 1. Verify Teacher Bulk Input Page ---
        print("\n--- Verifying Bulk Page (Teacher) ---", flush=True)

        # Set cookies for Teacher
        await context.add_cookies([
            {
                "name": "auth-storage",
                "value": json.dumps({
                    "state": {
                        "isAuthenticated": True,
                        "user": {
                            "id": "user-123",
                            "role": "TEACHER",
                            "name": "Teacher User"
                        }
                    },
                    "version": 0
                }),
                "domain": "localhost",
                "path": "/"
            },
            {
                "name": "accessToken",
                "value": "mock-token",
                "domain": "localhost",
                "path": "/"
            }
        ])

        page = await context.new_page()

        # Inject localStorage for client-side auth hooks (Teacher)
        await page.add_init_script("""
            localStorage.setItem('auth-storage', JSON.stringify({
                state: {
                    isAuthenticated: true,
                    user: {
                        id: 'user-123',
                        role: 'TEACHER',
                        name: 'Teacher User'
                    }
                },
                version: 0
            }));
            localStorage.setItem('accessToken', 'mock-token');
        """)

        # Mock API for Bulk Page
        # Mock auth/me to prevent hydration wipe
        await page.route("**/api/auth/me", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({
                "success": True,
                "data": {
                    "id": "user-123",
                    "role": "TEACHER",
                    "name": "Teacher User"
                }
            })
        ))

        await page.route("**/api/classes/my-classes", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({
                "success": True,
                "data": [
                    {"id": "class-1", "name": "Class 1A", "level": "1"}
                ]
            })
        ))

        await page.route("**/api/classes/class-1/enrollments", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({
                "success": True,
                "data": [
                    {
                        "id": "enroll-1",
                        "student": {
                            "id": "student-1",
                            "name": "Ahmad",
                            "nis": "12345",
                            "gender": "MALE"
                        }
                    },
                    {
                        "id": "enroll-2",
                        "student": {
                            "id": "student-2",
                            "name": "Fatir",
                            "nis": "67890",
                            "gender": "MALE"
                        }
                    }
                ]
            })
        ))

        print("Navigating to Bulk Page...", flush=True)
        try:
            await page.goto("http://localhost:3000/daily-report/bulk", timeout=60000)
            print(f"Current URL: {page.url}", flush=True)

            # Wait for network idle to ensure hydration
            await page.wait_for_load_state("networkidle")

            # Check for header
            if await page.is_visible("text=Input Laporan Harian Massal"):
                print("Bulk Page Header Visible", flush=True)
            else:
                print("Bulk Page Header NOT Visible", flush=True)
                await page.screenshot(path="error_bulk.png")

            print("Taking screenshot of Bulk Page...", flush=True)
            await page.screenshot(path="docs/images/daily-report-bulk.png")

        except Exception as e:
            print(f"Bulk verification failed: {e}", flush=True)
            await page.screenshot(path="error_bulk.png")

        await page.close()

        # --- 2. Verify Parent View Page ---
        print("\n--- Verifying Parent Page (Parent) ---", flush=True)

        # Update cookies for Parent (Role: PARENT)
        await context.add_cookies([
             {
                "name": "auth-storage",
                "value": json.dumps({
                    "state": {
                        "isAuthenticated": True,
                        "user": {
                            "id": "user-parent-1",
                            "role": "PARENT",
                            "name": "Parent User"
                        }
                    },
                    "version": 0
                }),
                "domain": "localhost",
                "path": "/"
            },
            {
                "name": "accessToken",
                "value": "mock-token-parent",
                "domain": "localhost",
                "path": "/"
            }
        ])

        page = await context.new_page()

        # Inject localStorage for client-side auth hooks (Parent)
        # CRITICAL: Inject accessToken to prevent fetchUser from clearing state
        await page.add_init_script("""
            localStorage.setItem('auth-storage', JSON.stringify({
                state: {
                    isAuthenticated: true,
                    user: {
                        id: 'user-parent-1',
                        role: 'PARENT',
                        name: 'Parent User'
                    }
                },
                version: 0
            }));
            localStorage.setItem('accessToken', 'mock-token-parent');
        """)

        # Mock API for Parent Page

        # CRITICAL: Mock auth/me to succeed
        await page.route("**/api/auth/me", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({
                "success": True,
                "data": {
                    "id": "user-parent-1",
                    "role": "PARENT",
                    "name": "Parent User"
                }
            })
        ))

        # 1. Mock 'My Children/Students'
        # The component calls '/api/parent/children'
        await page.route("**/api/parent/children", lambda route: route.fulfill(
             status=200,
             content_type="application/json",
             body=json.dumps({
                 "success": True,
                 "data": [
                     {
                         "id": "child-1",
                         "student": {
                             "id": "student-1",
                             "name": "Ahmad",
                             "nis": "12345",
                             "class": {"name": "1A", "teacher": {"name": "Ust. Guru"}}
                         }
                     }
                 ]
             })
        ))

        # 2. Mock 'Daily Reports' with SD IT specific fields (Sholat, Tahfidz)
        await page.route("**/api/daily-reports/student/student-1*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({
                "success": True,
                "data": {
                    "data": [
                        {
                            "id": "report-1",
                            "date": "2023-10-27T00:00:00.000Z", # Correct field name is 'date' in shared type? or reportDate?
                            # Backend service returns 'date' mapped from 'reportDate'?
                            # Let's check api response. Prisma model has reportDate.
                            # Shared type has 'date'.
                            # The Component uses 'report.date'.
                            # I'll use 'date' here to be safe, but Component uses 'report.date'.
                            "date": "2023-10-27T00:00:00.000Z",
                            "mood": "HAPPY",
                            "sholatSubuh": True,
                            "sholatDzuhur": True,
                            "sholatAshar": True,
                            "sholatMaghrib": True,
                            "sholatIsya": True,
                            "tahfidzActivity": "Surah Al-Mulk 1-5",
                            "tahfidzNote": "Good progress",
                            "notes": "Good progress",
                            "student": {"name": "Ahmad"}
                        }
                    ],
                    "meta": {
                        "page": 1,
                        "limit": 10,
                        "total": 1,
                        "totalPages": 1
                    }
                }
            })
        ))

        print("Navigating to Parent Buku Penghubung...", flush=True)
        try:
            await page.goto("http://localhost:3000/parent/buku-penghubung", timeout=60000)
            print(f"Current URL: {page.url}", flush=True)

            # Wait for main heading
            await page.wait_for_selector("text=Buku Penghubung Digital", timeout=30000)
            print("Heading 'Buku Penghubung Digital' found", flush=True)

            # Check for SD IT specific content
            if await page.is_visible("text=Laporan Harian Santri"):
                 print("Daily Report Section Visible", flush=True)

            # Wait a bit for the daily report list to render
            await page.wait_for_timeout(2000)

            # Check for content inside the report
            # The mock returns "Surah Al-Mulk 1-5" in tahfidzActivity?
            # Component logic: {report.tahfidzNote} is displayed.
            # I mocked "tahfidzActivity" but component displays "tahfidzNote".
            # I added "tahfidzNote": "Good progress" to mock.

            if await page.is_visible("text=Good progress"):
                 print("Tahfidz Content Verified", flush=True)

            print("Taking screenshot of Parent Page...", flush=True)
            await page.screenshot(path="docs/images/daily-report-parent.png")

        except Exception as e:
            print(f"Parent verification failed: {e}", flush=True)
            await page.screenshot(path="error_parent.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
