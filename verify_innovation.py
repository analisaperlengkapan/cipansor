import os
from playwright.sync_api import sync_playwright

def verify_innovation_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Mock API responses
        def handle_api(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body='[{"id":"prop-1","title":"AI Research Lab","description":"Proposal to establish an AI lab.","status":"DRAFT","type":"RESEARCH","createdAt":"2023-10-01T10:00:00Z","submittedBy":{"name":"Alice"}}]'
            )

        page.route("**/api/innovation", handle_api)

        try:
            # Navigate
            page.goto("http://localhost:3000/innovation")

            # Wait for content
            page.wait_for_selector("text=AI Research Lab", timeout=10000)

            # Screenshot
            os.makedirs("/home/jules/verification", exist_ok=True)
            page.screenshot(path="/home/jules/verification/innovation_dashboard.png", full_page=True)
            print("Screenshot taken")
        except Exception as e:
            print(f"Error: {e}")
            # Take error screenshot
            page.screenshot(path="/home/jules/verification/error.png")

        browser.close()

if __name__ == "__main__":
    verify_innovation_dashboard()
