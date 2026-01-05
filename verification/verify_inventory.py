import subprocess
import time
import socket
import os
import signal
import sys
import json
from urllib.request import urlopen
from urllib.error import URLError
from playwright.sync_api import sync_playwright

# Configuration
PORT = 3000
BASE_URL = f"http://localhost:{PORT}"
TIMEOUT = 60
LOG_FILE = "verification/server_output.log"
SCREENSHOT_FILE = "verification/inventory_page.png"
ERROR_SCREENSHOT = "verification/error.png"

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def wait_for_server(url, timeout=TIMEOUT):
    print(f"Waiting for server at {url}...")
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with urlopen(url) as response:
                if response.status == 200:
                    return True
        except URLError:
            time.sleep(1)
        except Exception as e:
            print(f"Waiting for server: {e}")
            time.sleep(1)
    return False

def verify_inventory_page():
    server_process = None
    server_started_by_script = False
    verification_passed = False

    try:
        # Check if server is running
        if not is_port_in_use(PORT):
            print(f"Starting Next.js server on port {PORT}...")
            try:
                # Open log file for server output
                log_fd = open(LOG_FILE, "w")

                # Run from the root of the repo
                # Using setsid to make it easier to kill the whole process group on Unix
                server_process = subprocess.Popen(
                    ["pnpm", "--filter", "web", "dev"],
                    stdout=log_fd,
                    stderr=subprocess.STDOUT,
                    preexec_fn=os.setsid
                )
                server_started_by_script = True

                if not wait_for_server(BASE_URL):
                    print("Failed to start server within timeout.")
                    print(f"Check {LOG_FILE} for details.")
                    return
                print("Server started successfully.")
            except FileNotFoundError:
                print("Error: pnpm not found. Please ensure pnpm is installed.")
                return
            except Exception as e:
                print(f"Error starting server: {e}")
                return
        else:
            print(f"Server already running on port {PORT}. Proceeding with existing instance.")

        with sync_playwright() as p:
            print("Launching browser...")
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()

            # ----------------------------------------------------------------
            # MOCK DATA - Strictly typed to match @cipansor/shared
            # ----------------------------------------------------------------

            # Asset Mock (Asset Interface)
            mock_asset = {
                "id": "1",
                "unitId": "unit-1",
                "categoryId": "cat-1",
                "code": "INV-001",
                "name": "Test Laptop",
                "brand": "Dell",
                "model": "XPS 13",
                "condition": "GOOD",
                "status": "ACTIVE", # Matching Shared Enum
                "category": {
                    "id": "cat-1",
                    "name": "Electronics",
                    "code": "ELEC"
                },
                "unit": {
                    "id": "unit-1",
                    "name": "Main Unit"
                },
                "quantity": 1,
                "createdAt": "2024-01-01T00:00:00.000Z",
                "updatedAt": "2024-01-01T00:00:00.000Z"
            }

            # InventoryStats Mock
            mock_stats = {
                "totalItems": 10,
                "totalValue": 5000000,
                "recentMaintenances": 0,
                "byStatus": [
                    {"status": "ACTIVE", "count": 10}
                ],
                "byCondition": [
                    {"condition": "GOOD", "count": 10}
                ],
                "byCategory": [
                    {"categoryId": "cat-1", "categoryName": "Electronics", "count": 10}
                ]
            }

            # Category Mock
            mock_categories = [
                {"id": "cat-1", "name": "Electronics", "code": "ELEC", "description": "Electronic devices"}
            ]

            # ----------------------------------------------------------------
            # ROUTE HANDLERS
            # ----------------------------------------------------------------

            # Mock Inventory Items
            page.route("**/api/inventory?**", lambda route: route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps({
                    "success": True,
                    "data": [mock_asset],
                    "meta": {"total": 1, "page": 1, "limit": 10, "totalPages": 1}
                })
            ))

            # Mock Inventory Summary
            page.route("**/api/inventory/stats**", lambda route: route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps({
                    "success": True,
                    "data": mock_stats
                })
            ))

            # Mock Categories
            page.route("**/api/inventory/categories", lambda route: route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps({
                    "success": True,
                    "data": mock_categories
                })
            ))

            # Mock Login/Session
            page.route("**/api/auth/**", lambda route: route.fulfill(status=200, body='{}'))

            try:
                # Navigate to the page
                print(f"Navigating to {BASE_URL}/inventory")
                page.goto(f"{BASE_URL}/inventory")

                # Wait for content
                print("Waiting for page content...")
                # Verify header
                page.wait_for_selector("text=Inventaris", timeout=30000)

                # Verify data rendering - wait for the specific row content
                # "Test Laptop" is in the 'Nama' column.
                print("Verifying 'Test Laptop' presence...")

                # Use a locator that waits automatically
                laptop_locator = page.get_by_text("Test Laptop")
                if laptop_locator.count() > 0 or laptop_locator.is_visible():
                     print("Verified: 'Test Laptop' is visible.")
                else:
                    # Wait a bit more explicitly if needed, but get_by_text usually doesn't wait unless used in expect/action
                    # Let's try to wait for it
                    page.wait_for_selector("text=Test Laptop", timeout=5000)
                    print("Verified: 'Test Laptop' is visible.")

                # Take screenshot for transient evidence
                page.screenshot(path=SCREENSHOT_FILE)
                print(f"Screenshot taken successfully: {SCREENSHOT_FILE}")

                verification_passed = True

            except Exception as e:
                print(f"Error during verification: {e}")
                try:
                    page.screenshot(path=ERROR_SCREENSHOT)
                    print(f"Error screenshot taken: {ERROR_SCREENSHOT}")
                except:
                    pass
            finally:
                browser.close()

    finally:
        if server_started_by_script and server_process:
            print("Stopping server...")
            try:
                os.killpg(os.getpgid(server_process.pid), signal.SIGTERM)
                server_process.wait(timeout=5)
            except Exception:
                pass
            print("Server stopped.")

        # Cleanup artifacts if verification passed
        if verification_passed:
            print("Verification passed. Cleaning up artifacts...")
            if os.path.exists(LOG_FILE):
                os.remove(LOG_FILE)
            if os.path.exists(SCREENSHOT_FILE):
                os.remove(SCREENSHOT_FILE)
            print("Cleanup complete.")
        else:
            print("Verification failed or incomplete. Artifacts preserved for debugging.")

if __name__ == "__main__":
    verify_inventory_page()
