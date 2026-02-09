"""Create per-county JSON templates in /data/locations.

Usage:
  python scripts/seed_locations_template.py

This does NOT hit any APIs. It simply creates empty arrays for each county file,
and can be extended later to ingest CSV exports.
"""

from pathlib import Path
import json

COUNTIES = [
  ("Pulaski", "pulaski"),
  ("Faulkner", "faulkner"),
  ("Saline", "saline"),
  ("White", "white"),
  ("Cleburne", "cleburne"),
  ("Perry", "perry"),
  ("Conway", "conway"),
  ("Van Buren", "van-buren"),
]

out_dir = Path("data/locations")
out_dir.mkdir(parents=True, exist_ok=True)

for _, slug in COUNTIES:
  p = out_dir / f"{slug}.json"
  if not p.exists():
    p.write_text(json.dumps([], indent=2), encoding="utf-8")
    print("Created", p)
  else:
    print("Exists ", p)
