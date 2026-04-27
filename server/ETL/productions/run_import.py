from __future__ import annotations

import json
import sys
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
ETL_ROOT = CURRENT_DIR.parent

if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

if str(ETL_ROOT) not in sys.path:
    sys.path.insert(0, str(ETL_ROOT))

from etl_production import process_production_files


def main() -> None:
    raw = sys.stdin.read().strip()
    payload = json.loads(raw) if raw else {}

    file_paths = payload.get("file_paths") or []
    read_all_sheets = bool(payload.get("read_all_sheets", True))

    result = process_production_files(
        file_paths=file_paths,
        read_all_sheets=read_all_sheets,
    )

    sys.stdout.write(json.dumps(result, ensure_ascii=True))


if __name__ == "__main__":
    main()