import os
import sys
import time
from playwright.sync_api import sync_playwright

OUT_DIR = "pitch/real_screenshots"
os.makedirs(OUT_DIR, exist_ok=True)

def capture_all():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Using 1440x900 viewport with device_scale_factor=2 for crisp high-resolution screenshots
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2
        )
        page = context.new_page()

        print("1. Capturing Landing Page Hero...")
        page.goto("http://localhost:3001/", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=f"{OUT_DIR}/01_hero.png", full_page=False)

        print("2. Capturing Problem Chapter...")
        prob_el = page.locator("#problem")
        if prob_el.count() > 0:
            prob_el.scroll_into_view_if_needed()
            time.sleep(0.5)
            prob_el.screenshot(path=f"{OUT_DIR}/02_problem_context.png")

        print("3. Capturing Architecture Diagram...")
        pipe_el = page.locator("#pipeline")
        if pipe_el.count() > 0:
            pipe_el.scroll_into_view_if_needed()
            time.sleep(0.5)
            pipe_el.screenshot(path=f"{OUT_DIR}/03_architecture.png")

        print("4. Capturing Trust Lab Interactive...")
        trust_el = page.locator("#trust")
        if trust_el.count() > 0:
            trust_el.scroll_into_view_if_needed()
            time.sleep(0.5)
            trust_el.screenshot(path=f"{OUT_DIR}/04_trust_lab.png")

        print("5. Capturing Ledger Demo Interactive...")
        ledger_el = page.locator("#review")
        if ledger_el.count() > 0:
            ledger_el.scroll_into_view_if_needed()
            time.sleep(0.5)
            ledger_el.screenshot(path=f"{OUT_DIR}/05_ledger_demo.png")

        print("6. Capturing Firewall Lab Interactive...")
        fw_el = page.locator("#firewall")
        if fw_el.count() > 0:
            fw_el.scroll_into_view_if_needed()
            time.sleep(0.5)
            fw_el.screenshot(path=f"{OUT_DIR}/06_firewall_lab.png")

        print("7. Capturing Prototype Hub...")
        page.goto("http://localhost:3001/prototype", wait_until="networkidle")
        time.sleep(0.5)
        page.screenshot(path=f"{OUT_DIR}/07_prototype_hub.png", full_page=False)

        print("8. Capturing Review Queue...")
        page.goto("http://localhost:3001/review", wait_until="networkidle")
        time.sleep(0.5)
        page.screenshot(path=f"{OUT_DIR}/08_review_queue.png", full_page=False)

        print("9. Capturing Before & After Compare Slider...")
        page.goto("http://localhost:3001/compare/pair_01", wait_until="networkidle")
        time.sleep(0.5)
        page.screenshot(path=f"{OUT_DIR}/09_compare_slider.png", full_page=False)

        print("10. Capturing Impact Claims & Coverage...")
        page.goto("http://localhost:3001/claims", wait_until="networkidle")
        time.sleep(0.5)
        page.screenshot(path=f"{OUT_DIR}/10_impact_claims.png", full_page=False)

        print("11. Capturing Verify Lineage & QR Inspector...")
        page.goto("http://localhost:3001/verify/dv_8f9a2b", wait_until="networkidle")
        time.sleep(0.5)
        page.screenshot(path=f"{OUT_DIR}/11_verify_lineage.png", full_page=False)

        print("12. Capturing Multi-Agent Investigation Hub...")
        page.goto("http://localhost:3001/investigate", wait_until="networkidle")
        time.sleep(0.5)
        page.screenshot(path=f"{OUT_DIR}/12_agent_investigate.png", full_page=False)

        print("13. Capturing Evidence Catalog...")
        page.goto("http://localhost:3001/evidence", wait_until="networkidle")
        time.sleep(0.5)
        page.screenshot(path=f"{OUT_DIR}/13_evidence_catalog.png", full_page=False)

        browser.close()
        print("All screenshots successfully captured!")

if __name__ == "__main__":
    capture_all()
