# Tokyo Delivery Health Girl Data Collection Project

**Project Name**: kaguya  
**Version**: 1.0 (High-Level Design)  
**Date**: March 08, 2026  
**Objective**: Build a personal tool to collect, store, and compare structured data on delivery health (deliheru / outcall escort service) girls in Tokyo from yoasobi-heaven.com/en, with support for column-based analysis and historical tracking of changes.

## 1. Project Overview

This project automates the extraction of girl profile information from the **YOASOBI HEAVEN** English portal (targeting delivery health / outcall escort services in Tokyo). Data is saved in a spreadsheet format for easy sorting, filtering, and visual comparison (e.g., by cup size, age, face photo quality, weight, availability).

Key differentiators:
- Focused exclusively on **delivery health** (identified via "outcall escort service", "delivery health", "deliheru" in shop/girl listings).
- Includes qualitative fields like face photo quality.
- Tracks historical snapshots to detect changes (new girls, availability shifts, price updates).

## 2. Scope & Assumptions

- **Geographic focus**: Tokyo only (`/en/tokyo/...` paths).
- **Service type**: Delivery health / outcall escort (common English label on site; "deliheru" in Japanese names).
- **Target volume**: 200–500 girls initially (expandable; realistic starting goal to avoid blocks).
- **Data freshness**: Availability is dynamic → snapshots timestamped.
- **Usage**: Personal, non-commercial; polite scraping (delays, no flooding).
- **Legal note**: Respect site terms/robots.txt; no redistribution of data.

## 3. Data Model (Core Spreadsheet Columns)

One row per girl per snapshot.

| Column                  | Type         | Description / Extraction Logic                                      | Example                          | Track History? | Notes / Derivation |
|-------------------------|--------------|---------------------------------------------------------------------|----------------------------------|----------------|--------------------|
| Snapshot_Date           | Date         | Date of data capture (YYYY-MM-DD)                                   | 2026-03-08                       | N/A            | Auto-filled        |
| Profile_URL             | URL          | Full girl profile link (unique key)                                 | https://.../girlid-61808003/     | Yes            | Hyperlink          |
| Girl_Name               | String       | Stage name (e.g. from profile header)                               | YUYU                             | Yes            |                    |
| Age                     | Integer      | Parsed from [19Age] or similar                                      | 19                               | Yes            |                    |
| Height_cm               | Integer      | From Txxx (e.g. T160 → 160)                                         | 160                              | Yes            | Regex extract      |
| Measurements            | String       | Full bust-waist-hips + cup (B91(G)-W56-H86)                         | B91(G)-W56-H86                   | Yes            |                    |
| Cup_Size                | String       | Extracted cup letter (G, F, etc.)                                   | G                                | Yes            | Formula/regex      |
| Weight_kg               | Integer/String | If explicitly listed (often missing)                                | 48 or "N/A"                      | Yes            | Text search        |
| Shop_Name               | String       | Shop name from profile or parent shop                               | ROBOT DELIHEL                    | Yes            |                    |
| Service_Type            | String       | Confirmed "outcall escort service" / "delivery health" variant      | outcall escort service           | Yes            | Filter criterion   |
| Area                    | String       | Shop dispatch area (Shinjuku・Kabukicho, etc.)                      | Shinjuku・Kabukicho              | Yes            |                    |
| Price_From_Yen          | Integer      | Starting price (shop or girl-specific)                              | 30000                            | Yes            |                    |
| Face_Photo_Quality      | String       | Qualitative: "High" (≥3 clear/unblurred face shots), "Medium", "Low" | High (4 clear faces)             | No             | Count gallery imgs + heuristic |
| Main_Face_Photo_URL     | URL          | URL of primary clear face photo (if identifiable)                   | https://.../photo-main.jpg       | No             | Optional reference |
| Availability_Notes      | String       | Text summary of schedule/calendar (○/× days, slots)                 | ○ Mon-Thu, × Fri-Sun             | Yes            | Critical field     |
| Review_Count            | Integer      | If available on profile                                             | 12                               | Yes            |                    |
| Change_Notes            | String       | Auto-detected diffs from previous snapshot (e.g. "Availability ↑")  | Price increased ¥5,000           | N/A            | Post-process       |
| Personal_Notes          | String       | Manual user comments                                                | Slim, good English chat          | No             |                    |

- **Historical storage** — Append-only: New rows for each run. Use `Profile_URL` + `Snapshot_Date` as composite key.
- **Derived/calculated** — Use spreadsheet formulas (e.g., cup extraction, conditional formatting for high cup sizes).

## 4. Data Acquisition Strategy

### Entry Points
1. Aggregated girl list: https://yoasobi-heaven.com/en/tokyo/girl-list/ (cross-shop; filter manually or post-extract for "outcall escort").
2. Shop list filtered to outcall: https://yoasobi-heaven.com/en/tokyo/shop-list/ (or sub-areas like /A1304/shop-list/ for Shinjuku).
   - Target shops with "DELIVERY HEALTH", "DELIHERU", "OUTCALL ESCORT" in name/desc (e.g., ROBOT DELIHEL, TOKYO KYONYU DELIHELU OPPAI MART, HITOZUMA WAKAZUMA DELIHERU LADY PLACE).
3. Known high-quality delivery health shops (seed list examples):
   - ROBOT DELIHEL (/en/tokyo/A1304/robo-deli/)
   - TOKYO KYONYU DELIHELU OPPAI MART (/en/tokyo/A1304/oppaimart/)
   - CON-CAFÉ AND DELIHERU CHIIKANO DELUXE (/en/tokyo/A1303/concafechiikano-dx/)
   - HITOZUMA WAKAZUMA DELIHERU LADY PLACE (/en/tokyo/A1304/ookubo-epron/)

### Extraction Flow
1. Discover → Crawl girl-list or selected shop girl lists → collect profile URLs where service_type matches delivery health.
2. Extract → For each profile URL:
   - Load with Playwright (headless browser).
   - Parse visible text/selectors for name, age, measurements, etc.
   - Analyze photo gallery for face quality.
   - Capture availability text.
3. Store → Append to CSV / Google Sheet.

## 5. Technical Architecture

- **Language**: Python 3.10+
- **Core libraries**:
  - `playwright` → Browser automation (JS rendering).
  - `pandas` → Data handling / CSV output.
  - `beautifulsoup4` → HTML parsing (after page.content()).
  - `re` → Regex for parsing Txxx, Bxx(Cup), etc.
  - `gspread` + `oauth2client` (optional) → Direct Google Sheets write.
- **Execution modes**:
  - Full run: Discover + extract.
  - Update run: Load existing data → re-check known URLs → append changes.
- **Politeness**:
  - 8–15 second delay between requests.
  - Random user-agent rotation.
  - Headless=True in production; False for debugging.

## 6. Risks & Mitigations

| Risk                          | Mitigation Strategy                                      |
|-------------------------------|------------------------------------------------------------------|
| IP blocking / Cloudflare      | Slow pacing, residential proxies if needed, monitor errors.      |
| JS-heavy / dynamic content    | Use Playwright exclusively (no simple requests).                 |
| Missing fields (weight, etc.) | Default to "N/A"; log for manual review.                         |
| Site layout changes           | Use flexible regex + multiple fallback selectors; version checks. |
| Data volume / performance     | Batch processing (e.g., 50 girls per run); resume capability.    |

## 7. Next Steps / Milestones

1. **Prototype** (1–2 weeks): Manual seed 20 profiles → build basic Playwright extractor script → validate schema on sample CSV.
2. **Discovery module** → Auto-collect profile URLs from girl-list / shop lists.
3. **Historical diff logic** → Compare snapshots, generate Change_Notes.
4. **Deployment** → Schedule weekly runs (cron / manual) → Google Sheets auto-update.
5. **Enhancements** (future): Proxy rotation, photo download/thumbnail, advanced filtering UI.

This design provides a solid, actionable foundation. If you'd like a starter Python code skeleton, seed shop URL list expansion, or Google Sheets template structure, let me know!