import subprocess
import time
import socket
import os
import signal
import sys
from urllib.request import urlopen
from urllib.error import URLError
from playwright.sync_api import sync_playwright

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def wait_for_server(url, timeout=60):
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

    try:
        # Check if server is running
        if not is_port_in_use(3000):
            print("Starting Next.js server...")
            try:
                # Run from the root of the repo
                # Using setsid to make it easier to kill the whole process group on Unix
                # Redirect output to DEVNULL to avoid pipe buffer deadlocks
                server_process = subprocess.Popen(
                    ["pnpm", "--filter", "web", "dev"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    preexec_fn=os.setsid
                )
                server_started_by_script = True

                if not wait_for_server("http://localhost:3000"):
                    print("Failed to start server within timeout.")
                    # Cleanup is handled in finally block
                    return
                print("Server started successfully.")
            except FileNotFoundError:
                print("Error: pnpm not found. Please ensure pnpm is installed.")
                return
            except Exception as e:
                print(f"Error starting server: {e}")
                return
        else:
            print("Server already running on port 3000.")

        with sync_playwright() as p:
            print("Launching browser...")
            browser = p.chromium.launch(headless=True)
            # Mock API responses since we don't have a real backend
            context = browser.new_context()
            page = context.new_page()

            # Mock Inventory Items
            page.route("**/api/inventory?**", lambda route: route.fulfill(
                status=200,
                content_type="application/json",
                body='{"success": true, "data": [{"id": "1", "code": "INV-001", "name": "Test Laptop", "categoryId": "cat-1", "category": {"id": "cat-1", "name": "Electronics"}, "quantity": 1, "condition": "GOOD", "status": "AVAILABLE"}], "meta": {"total": 1, "page": 1, "limit": 10, "totalPages": 1}}'
            ))

            # Mock Inventory Summary
            page.route("**/api/inventory/stats**", lambda route: route.fulfill(
                status=200,
                content_type="application/json",
                body='{"success": true, "data": {"totalItems": 10, "totalQuantity": 15, "totalValue": 5000000, "byStatus": [], "byCondition": [], "byCategory": []}}'
            ))

            # Mock Categories
            page.route("**/api/inventory/categories", lambda route: route.fulfill(
                status=200,
                content_type="application/json",
                body='{"success": true, "data": [{"id": "cat-1", "name": "Electronics", "code": "ELEC"}]}'
            ))

            # Mock Login/Session
            page.route("**/api/auth/**", lambda route: route.fulfill(status=200, body='{}'))

            try:
                # Navigate to the page - assuming Next.js dev server runs on 3000
                print("Navigating to http://localhost:3000/inventory")
                page.goto("http://localhost:3000/inventory")

                # Wait for content
                print("Waiting for selector 'text=Inventaris'...")
                page.wait_for_selector("text=Inventaris", timeout=30000)

                # Take screenshot
                # Note: We take the screenshot to verify it renders, but we should not commit it.
                # Ideally, we would delete it or just assert visibility.
                # For this task, we will take it and then delete it in finally or just not commit it.
                # The user context implied running this script to verify.
                page.screenshot(path="verification/inventory_page.png")
                print("Screenshot taken successfully: verification/inventory_page.png")
            except Exception as e:
                print(f"Error during verification: {e}")
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

if __name__ == "__main__":
    verify_inventory_page()
