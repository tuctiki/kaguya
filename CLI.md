# kaguya CLI Interface Guide

This document describes how to interact with **kaguya**, the Tokyo Delivery Health data collection tool.

## Overview
**kaguya** is a Python-based CLI tool that automates the discovery and scraping of girl profiles from Yoasobi Heaven. It uses Playwright for browser automation and SQLAlchemy (SQLite) for robust data management.

## Installation
Ensure you are in the project root and the virtual environment is active:
```bash
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

## CLI Usage
The main entry point is `kaguya.py`.

### Syntax
```bash
python3 kaguya.py [--mode {full,update,update-images}] [--pages <int>] [--area <code>] [--db <url>]
```

### Arguments
| Argument | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `--mode` | string | `full` | `full`: Discover new URLs and scrape.<br>`update`: Re-scrape all existing URLs in the DB.<br>`update-images`: Only scrape profiles missing local images. |
| `--pages` | integer | `5` | (Full mode only) Number of pages to crawl for discovery. |
| `--area` | string | _none_ | Area code for profile discovery (e.g., `A1311`, `A1304`). Limits discovery to specific wards/districts. |
| `--db` | string | `sqlite:///kaguya.db` | SQLAlchemy database URL. |

### Area Codes
Use area codes to narrow profile discovery to specific Tokyo wards/districts:
- `A1311` — Chiyoda-ku (千代田区)
- `A1304` / `A130401` — Chuo-ku (中央区)
- See Yoasobi Heaven area list for other codes

Example:
```bash
# Discover profiles only from Chiyoda district
python3 kaguya.py --mode full --area A1311 --pages 3
```

## Operational Considerations

### 1. Anti-Scraping Delays
**kaguya** is optimized for "polite" scraping. Execution will be slow:
- **Per Profile**: 10–20 seconds random delay.
- **Per Batch**: After every 20 profiles, a 5–10 minute break is enforced.
- **Age Verification**: Handled automatically via click-bypass.

### 2. Output Data (SQLite)
The data is stored in `kaguya.db`. You can query it using standard SQL or view it via the Web GUI.
Key Tables:
- `girl_profiles`: Core profile information (Name, ID, Photo path).
- `snapshots`: Historical data (Price, Availability, Reviews, Change Notes).

### 3. Example Workflows

#### Daily Collection (Discovery)
```bash
# Full discovery across all areas
python3 kaguya.py --mode full

# Target specific ward/district
python3 kaguya.py --mode full --area A1311 --pages 3
```

#### Weekly Trend Update
```bash
# Re-scrape all existing profiles
python3 kaguya.py --mode update
```

#### Image Recovery (Filling gaps)
```bash
# Recover missing images from database URLs
python3 kaguya.py --mode update-images
```

## Advanced Usage

### Custom Database Location
```bash
python3 kaguya.py --mode full --db /path/to/my_kaguya.db
```

### Area-Based Discovery
Use `--area` parameter to limit discovery to specific Tokyo wards:
- `A1311` — Chiyoda-ku (千代田区)
- `A1304` / `A130401` — Chuo-ku (中央区)
- See Yoasobi Heaven area list for complete codes

Example: Target Shibuya
```bash
python3 kaguya.py --mode full --area A1311 --pages 5
```

### Performance Tips
- Use `--pages 2-3` for daily quick checks
- Use `--pages 5-10` for comprehensive weekly discovery
- Always run in "polite" mode—don't disable delays, it helps avoid blocking
- Schedule batch updates during off-hours (the tool enforces breaks automatically)

## Module Reference
- `discovery.py`: `DiscoveryModule`
- `scraper.py`: `ProfileScraper` (includes `download_image`)
- `database.py`: SQLAlchemy models (`GirlProfile`, `Snapshot`)
- `api.py`: FastAPI server for the Web GUI
