"""Bulk-add schemes to app/data/schemes.json from a CSV, instead of typing JSON by hand.

Why this exists: there is no official live API for Indian government schemes
(myScheme.gov.in does not publish one). Public research datasets scraped from it
do exist on Kaggle and HuggingFace and are a reasonable way to grow past the 23
starter schemes, but they are unofficial snapshots, not live feeds, so treat this
as an occasional bulk-import step, not something you run automatically.

WHAT THIS SCRIPT DOES:
  - Reads a CSV of scheme rows (see COLUMN MAPPING below)
  - Skips slugs that already exist in schemes.json
  - Adds new entries with empty `rules` ({}) by default, meaning the eligibility
    engine will mark them "likely" rather than a firm yes/no, since automatically
    inferring exact eligibility rules from free-text descriptions isn't reliable
    enough to do without a human check. Open the scheme in schemes.json afterwards
    and add rules for anything you want firm eligibility matching on
    (see the docstring in app/eligibility.py for supported rule keys).
  - If an LLM is configured (LLM_API_KEY / LLM_BASE_URL), it asks the model to draft
    a Hindi translation for review. Without a key, Hindi fields fall back to the
    English text (the app already handles that fallback gracefully at display time).

USAGE:
    python3 scripts/import_schemes.py path/to/schemes.csv

COLUMN MAPPING (case-insensitive; adjust CSV_COLUMNS below if your source differs):
    scheme_name, description, benefits, eligibility, application_process (or link/url), ministry, tags

After running, review app/data/schemes.json (especially "rules": {} entries) before
restarting the backend so it re-seeds with the new schemes.
"""
import asyncio
import csv
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
from app import llm  # noqa: E402

DATA_FILE = pathlib.Path(__file__).parent.parent / "app" / "data" / "schemes.json"

CSV_COLUMNS = {
    "name": ["scheme_name", "name", "title"],
    "summary": ["description", "summary", "about"],
    "benefits": ["benefits", "benefit"],
    "eligibility_text": ["eligibility", "eligibility_criteria"],
    "apply_url": ["application_process", "link", "url", "official_link"],
    "ministry": ["ministry", "department"],
    "tags": ["tags", "category", "sector"],
}


def slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s[:60]


def pick(row: dict, keys: list[str]) -> str:
    lower_row = {k.lower().strip(): v for k, v in row.items()}
    for k in keys:
        if k in lower_row and lower_row[k]:
            return lower_row[k].strip()
    return ""


async def translate_to_hindi(text: str) -> str:
    if not text or not llm.configured():
        return text
    system = ("Translate the following Indian government scheme text into simple, everyday Hindi "
               "(Devanagari script). Return ONLY the translation, no notes, no markdown.")
    result = await llm.complete(system, [{"role": "user", "content": text}], max_tokens=300)
    return result or text


async def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/import_schemes.py path/to/schemes.csv")
        sys.exit(1)

    csv_path = pathlib.Path(sys.argv[1])
    existing = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    existing_slugs = {e["slug"] for e in existing}

    added = 0
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = pick(row, CSV_COLUMNS["name"])
            if not name:
                continue
            slug = slugify(name)
            if slug in existing_slugs:
                continue

            summary = pick(row, CSV_COLUMNS["summary"]) or "No summary provided, please add one."
            benefits = pick(row, CSV_COLUMNS["benefits"]) or "See official portal for benefit details."
            eligibility_text = pick(row, CSV_COLUMNS["eligibility_text"]) or "See official portal for eligibility."
            apply_url = pick(row, CSV_COLUMNS["apply_url"]) or ""
            ministry = pick(row, CSV_COLUMNS["ministry"]) or ""
            tags_raw = pick(row, CSV_COLUMNS["tags"])
            tags = [t.strip().lower() for t in re.split(r"[,;/]", tags_raw) if t.strip()] or ["general"]

            hi_name = await translate_to_hindi(name)
            hi_summary = await translate_to_hindi(summary)
            hi_benefits = await translate_to_hindi(benefits)
            hi_eligibility = await translate_to_hindi(eligibility_text)

            existing.append({
                "slug": slug,
                "ministry": ministry,
                "tags": tags,
                "apply_url": apply_url,
                "rules": {},  # left empty on purpose, see module docstring; add rules manually after review
                "en": {"name": name, "summary": summary, "benefits": benefits,
                       "eligibility_text": eligibility_text, "documents": []},
                "hi": {"name": hi_name, "summary": hi_summary, "benefits": hi_benefits,
                       "eligibility_text": hi_eligibility, "documents": []},
            })
            existing_slugs.add(slug)
            added += 1
            print(f"+ {name}")

    DATA_FILE.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nAdded {added} new schemes. Total: {len(existing)}.")
    print("Review app/data/schemes.json, especially empty \"rules\": {} and \"documents\": [] fields, "
          "then restart the backend to re-seed.")


if __name__ == "__main__":
    asyncio.run(main())
