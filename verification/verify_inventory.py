from playwright.sync_api import sync_playwright

def verify_inventory_page():
    with sync_playwright() as p:
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

        # Mock Login/Session if needed (bypassing auth for now or assuming page handles unauth gracefully or we mock next-auth)
        # For simplicity, we just visit the page and hope it renders components even if auth fails (or we mock auth endpoint)
        page.route("**/api/auth/**", lambda route: route.fulfill(status=200, body='{}'))

        try:
            # Navigate to the page - assuming Next.js dev server runs on 3000
            # Note: We need to start the server first in a separate process
            page.goto("http://localhost:3000/inventory")

            # Wait for content
            page.wait_for_selector("text=Inventaris", timeout=10000)

            # Take screenshot
            page.screenshot(path="verification/inventory_page.png")
            print("Screenshot taken successfully")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_inventory_page()
