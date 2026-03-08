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
python3 kaguya.py [--mode {full,update,update-images}] [--pages <int>] [--db <url>]
```

### Arguments
| Argument | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `--mode` | string | `full` | `full`: Discover new URLs and scrape.<br>`update`: Re-scrape all existing URLs in the DB.<br>`update-images`: Only scrape profiles missing local images. |
| `--pages` | integer | `5` | (Full mode only) Number of pages to crawl for discovery. |
| `--db` | string | `sqlite:///kaguya.db` | SQLAlchemy database URL. |

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
python3 kaguya.py --mode full --pages 3
```

#### Weekly Trend Update
```bash
python3 kaguya.py --mode update
```

#### Image Recovery (Filling gaps)
If you have legacy records without photos:
```bash
python3 kaguya.py --mode update-images
```

## Module Reference
- `discovery.py`: `DiscoveryModule`
- `scraper.py`: `ProfileScraper` (includes `download_image`)
- `database.py`: SQLAlchemy models (`GirlProfile`, `Snapshot`)
- `api.py`: FastAPI server for the Web GUI
