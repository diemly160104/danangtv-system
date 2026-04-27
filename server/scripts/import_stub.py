import json
import sys

def main():
    raw = sys.stdin.read().strip()
    payload = json.loads(raw) if raw else {}

    result = {
        "ok": True,
        "imported_count": 0,
        "warnings": [
            "Đây là import stub Python.",
            "Bạn hãy thay file này bằng ETL thật sau này."
        ],
        "message": f"Stub Python đã nhận batch {payload.get('batch_id')} cho module {payload.get('module')}."
    }

    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()