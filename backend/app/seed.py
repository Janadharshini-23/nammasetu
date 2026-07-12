"""Seeds the database from app/data/schemes.json.

Scheme content lives in a plain JSON file, not in Python code, so adding or
correcting a scheme means editing data, not touching application logic. See
app/data/schemes.json and the "Managing scheme data" section of the README
for how to extend this dataset (including from a scraped or admin-curated
source in the future).

IMPORTANT: This is a curated starter dataset for development/demo. Rules and
income caps change over time. Always verify against https://www.myscheme.gov.in
and the official scheme portals before relying on results.
"""
import json
import pathlib
from sqlalchemy.orm import Session
from .models import Scheme

DATA_FILE = pathlib.Path(__file__).parent / "data" / "schemes.json"


def load_dataset():
    with open(DATA_FILE, encoding="utf-8") as f:
        return json.load(f)


def seed(db: Session) -> int:
    added = 0
    for entry in load_dataset():
        if db.query(Scheme).filter(Scheme.slug == entry["slug"]).first():
            continue
        en, hi = entry["en"], entry["hi"]
        db.add(Scheme(
            slug=entry["slug"],
            level="Central",
            ministry=entry.get("ministry"),
            tags=entry.get("tags", []),
            rules=entry.get("rules", {}),
            apply_url=entry.get("apply_url"),
            name=en["name"], name_hi=hi["name"],
            summary=en["summary"], summary_hi=hi["summary"],
            benefits=en["benefits"], benefits_hi=hi["benefits"],
            eligibility_text=en["eligibility_text"], eligibility_text_hi=hi["eligibility_text"],
            documents=en["documents"], documents_hi=hi["documents"],
        ))
        added += 1
    db.commit()
    return added
