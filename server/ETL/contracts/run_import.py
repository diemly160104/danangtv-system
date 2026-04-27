from __future__ import annotations

import json
import sys
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent          # server/ETL/contracts
ETL_ROOT = CURRENT_DIR.parent                         # server/ETL

for path in (str(CURRENT_DIR), str(ETL_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)

from etl_contract import process_contract_service_files


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    raw = sys.stdin.read().strip()
    payload = json.loads(raw) if raw else {}

    file_paths = payload.get("file_paths") or []
    read_all_sheets = bool(payload.get("read_all_sheets", True))
    selected_contract_type = payload.get("contract_type") or "service"

    result = process_contract_service_files(
        file_paths=file_paths,
        read_all_sheets=read_all_sheets,
        selected_contract_type=selected_contract_type,
    )

    sys.stdout.write(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()