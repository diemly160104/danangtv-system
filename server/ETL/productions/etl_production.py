from __future__ import annotations

from datetime import date
import re
from typing import Any, Optional

import pandas as pd

from common import (
    clean_person_name,
    clean_text,
    extract_month_year,
    is_blank,
    read_import_sources,
)

# =========================================================
# TÊN CỘT THEO FILE MẪU
# =========================================================

COL_STT = "STT"
COL_PROGRAM_NAME = "Chương trình"
COL_GENRE = "Thể loại"
COL_DURATION = "Thời lượng"
COL_BROADCAST_FREQUENCY = "Tần suất phát sóng"
COL_EXECUTION = "Thực hiện"
COL_APPROVER = "Duyệt"
COL_NOTE = "Ghi chú"
COL_REGISTERED_TOPIC = "Đăng ký đề tài"
COL_BROADCAST_TIME = "Thời gian phát sóng"

# =========================================================
# GIÁ TRỊ MẶC ĐỊNH
# =========================================================

DEFAULT_PRODUCTION_STATUS = "planned"
DEFAULT_PRODUCTION_TASK_ROLE = "Thực hiện chương trình"
DEFAULT_EMPLOYEE_DEPARTMENT = "television"

SERVICE_NOTE_MARKERS = {"theo hđ", "theo hd"}

RE_FIRST_NUMBER = re.compile(r"(\d+)")

# =========================================================
# HEADER / CỘT
# =========================================================

def build_headers(df: pd.DataFrame) -> list[str]:
    if len(df) == 0:
        return []
    return [clean_text(value) for value in df.iloc[0].fillna("").tolist()]


def resolve_columns(headers: list[str]) -> dict[str, int]:
    mapping: dict[str, int] = {}
    for idx, header in enumerate(headers):
        mapping[header] = idx
    return mapping


def get_cell(row_values: list[Any], col_map: dict[str, int], column_name: str) -> Any:
    idx = col_map.get(column_name)
    if idx is None or idx >= len(row_values):
        return ""
    return row_values[idx]


def is_empty_row(row_values: list[Any]) -> bool:
    return all(is_blank(value) for value in row_values)


# =========================================================
# CHUẨN HÓA / PARSE
# =========================================================

def normalize_note_text(value: Any) -> str:
    return clean_text(value, uppercase_first=True)


def normalize_title_text(value: Any) -> str:
    # Chỉ viết hoa đầu dòng, không title-case để tránh hỏng HĐND, HTCTCS...
    return clean_text(value, uppercase_first=True)


def parse_duration_minutes(value: Any) -> Optional[int]:
    text = clean_text(value)
    if not text:
        return None

    match = RE_FIRST_NUMBER.search(text)
    if not match:
        return None

    minutes = int(match.group(1))
    return minutes if minutes > 0 else None


def build_month_start_date(default_month: Optional[int], default_year: Optional[int]) -> Optional[str]:
    if default_month is None or default_year is None:
        return None

    try:
        return date(default_year, default_month, 1).isoformat()
    except ValueError:
        return None


def detect_production_type(note_text: str) -> str:
    lowered = clean_text(note_text).lower()

    if any(marker in lowered for marker in SERVICE_NOTE_MARKERS):
        return "service"

    return "internal"


def split_people_names(value: Any) -> list[str]:
    text = clean_text(value)
    if not text:
        return []

    raw_parts = re.split(r"[,\n;]+", text)

    results: list[str] = []
    seen: set[str] = set()

    for part in raw_parts:
        name = clean_person_name(part)
        if not name:
            continue

        key = name.lower()
        if key in seen:
            continue

        seen.add(key)
        results.append(name)

    return results


def unique_non_blank_texts(values: list[str]) -> list[str]:
    results: list[str] = []
    seen: set[str] = set()

    for value in values:
        text = clean_text(value, uppercase_first=True)
        if not text:
            continue

        key = text.lower()
        if key in seen:
            continue

        seen.add(key)
        results.append(text)

    return results


# =========================================================
# XÁC ĐỊNH DÒNG GỐC / DÒNG NỐI
# =========================================================

def is_total_row(row_values: list[Any], col_map: dict[str, int]) -> bool:
    stt_text = clean_text(get_cell(row_values, col_map, COL_STT)).lower()
    return stt_text in {"cộng", "tong cong", "tổng cộng"}


def is_new_main_row(row_values: list[Any], col_map: dict[str, int]) -> bool:
    stt_text = clean_text(get_cell(row_values, col_map, COL_STT))
    program_name = clean_text(get_cell(row_values, col_map, COL_PROGRAM_NAME))
    return bool(stt_text or program_name)


def has_continuation_content(row_values: list[Any], col_map: dict[str, int]) -> bool:
    candidate_columns = [
        COL_EXECUTION,
        COL_NOTE,
        COL_REGISTERED_TOPIC,
        COL_BROADCAST_TIME,
        COL_APPROVER,
    ]

    return any(clean_text(get_cell(row_values, col_map, col)) for col in candidate_columns)


def group_rows_into_records(
    data_rows: list[list[Any]],
    col_map: dict[str, int],
) -> tuple[list[list[tuple[int, list[Any]]]], list[dict[str, Any]]]:
    groups: list[list[tuple[int, list[Any]]]] = []
    skipped_rows: list[dict[str, Any]] = []

    current_group: list[tuple[int, list[Any]]] = []

    for row_idx, row_values in enumerate(data_rows, start=2):
        if is_empty_row(row_values):
            skipped_rows.append(
                {
                    "row_number": row_idx,
                    "reason": "Dòng rỗng.",
                }
            )
            continue

        if is_total_row(row_values, col_map):
            skipped_rows.append(
                {
                    "row_number": row_idx,
                    "reason": "Dòng tổng hợp.",
                }
            )
            continue

        if is_new_main_row(row_values, col_map):
            if current_group:
                groups.append(current_group)
            current_group = [(row_idx, row_values)]
            continue

        if has_continuation_content(row_values, col_map):
            if current_group:
                current_group.append((row_idx, row_values))
            else:
                skipped_rows.append(
                    {
                        "row_number": row_idx,
                        "reason": "Dòng nối nhưng không có dòng gốc phía trước.",
                    }
                )
            continue

        skipped_rows.append(
            {
                "row_number": row_idx,
                "reason": "Không nhận diện được là dòng dữ liệu sản xuất.",
            }
        )

    if current_group:
        groups.append(current_group)

    return groups, skipped_rows


# =========================================================
# GOM THÔNG TIN TỪ 1 LOGICAL RECORD
# =========================================================

def first_non_blank_from_group(
    grouped_rows: list[tuple[int, list[Any]]],
    col_map: dict[str, int],
    column_name: str,
) -> str:
    for _, row_values in grouped_rows:
        text = clean_text(get_cell(row_values, col_map, column_name))
        if text:
            return text
    return ""


def collect_column_texts(
    grouped_rows: list[tuple[int, list[Any]]],
    col_map: dict[str, int],
    column_name: str,
) -> list[str]:
    values: list[str] = []

    for _, row_values in grouped_rows:
        text = clean_text(get_cell(row_values, col_map, column_name))
        if text:
            values.append(text)

    return values


def build_task_people_for_issue(
    row_values: list[Any],
    col_map: dict[str, int],
) -> list[dict[str, Any]]:
    names = split_people_names(get_cell(row_values, col_map, COL_EXECUTION))

    return [
        {
            "name": name,
            "department": DEFAULT_EMPLOYEE_DEPARTMENT,
            "role_label": DEFAULT_PRODUCTION_TASK_ROLE,
            "notes": "",
        }
        for name in names
    ]


def build_issue_rows(
    grouped_rows: list[tuple[int, list[Any]]],
    col_map: dict[str, int],
) -> list[dict[str, Any]]:
    """
    Mỗi issue row tương ứng với 1 số/phát.
    Ưu tiên nhận diện theo các cột:
    - Thực hiện
    - Đăng ký đề tài
    - Thời gian phát sóng

    Nếu cả group không có các cột này thì coi cả group là 1 issue duy nhất.
    """
    issue_rows: list[dict[str, Any]] = []

    for row_number, row_values in grouped_rows:
        execution_text = clean_text(get_cell(row_values, col_map, COL_EXECUTION))
        topic_text = normalize_title_text(get_cell(row_values, col_map, COL_REGISTERED_TOPIC))
        broadcast_time = clean_text(get_cell(row_values, col_map, COL_BROADCAST_TIME))

        if execution_text or topic_text or broadcast_time:
            issue_rows.append(
                {
                    "row_number": row_number,
                    "row_values": row_values,
                    "registered_topic": topic_text,
                    "broadcast_time": broadcast_time,
                }
            )

    if issue_rows:
        return issue_rows

    # fallback: cả group chỉ là 1 số
    first_row_number, first_row_values = grouped_rows[0]
    return [
        {
            "row_number": first_row_number,
            "row_values": first_row_values,
            "registered_topic": normalize_title_text(
                get_cell(first_row_values, col_map, COL_REGISTERED_TOPIC)
            ),
            "broadcast_time": clean_text(
                get_cell(first_row_values, col_map, COL_BROADCAST_TIME)
            ),
        }
    ]


def build_production_name(
    program_name: str,
    registered_topic: str,
    issue_index: int,
    total_issues: int,
) -> str:
    if registered_topic:
        return f"{program_name} - {registered_topic}"

    if total_issues > 1:
        return f"{program_name} - Số {issue_index}"

    return program_name


def build_issue_note(
    raw_note: str,
    broadcast_frequency: str,
    broadcast_time: str,
    total_issues: int,
) -> str:
    lines: list[str] = []

    note_text = normalize_note_text(raw_note)
    if note_text:
        lines.append(f"Ghi chú: {note_text}")

    # Chỉ giữ tần suất cho trường hợp 1 số / 1 dòng
    if total_issues == 1 and broadcast_frequency:
        lines.append(f"Tần suất phát sóng: {broadcast_frequency}")

    if broadcast_time:
        lines.append(f"Ngày phát: {broadcast_time}")

    return "\n".join(lines).strip()


# =========================================================
# VALIDATE
# =========================================================

def validate_record(
    production_name: str,
    start_date: Optional[str],
) -> list[str]:
    errors: list[str] = []

    if not production_name:
        errors.append("Thiếu tên chương trình / dự án sản xuất.")

    if not start_date:
        errors.append("Không lấy được tháng/năm từ tên sheet hoặc file để tạo ngày bắt đầu.")

    return errors


# =========================================================
# CHUYỂN 1 GROUP THÀNH NHIỀU RECORD IMPORT
# =========================================================

def transform_group_to_records(
    grouped_rows: list[tuple[int, list[Any]]],
    col_map: dict[str, int],
    file_name: str,
    sheet_name: Optional[str],
    default_month: Optional[int],
    default_year: Optional[int],
) -> list[dict[str, Any]]:
    program_name = normalize_title_text(
        first_non_blank_from_group(grouped_rows, col_map, COL_PROGRAM_NAME)
    )
    genre = normalize_title_text(
        first_non_blank_from_group(grouped_rows, col_map, COL_GENRE)
    )
    duration_minutes = parse_duration_minutes(
        first_non_blank_from_group(grouped_rows, col_map, COL_DURATION)
    )
    broadcast_frequency = clean_text(
        first_non_blank_from_group(grouped_rows, col_map, COL_BROADCAST_FREQUENCY)
    )

    all_notes = collect_column_texts(grouped_rows, col_map, COL_NOTE)
    shared_note = normalize_note_text(all_notes[0]) if all_notes else ""
    production_type = detect_production_type(" ".join(all_notes))

    producer_name = clean_person_name(
        first_non_blank_from_group(grouped_rows, col_map, COL_APPROVER)
    )

    start_date = build_month_start_date(default_month, default_year)
    issue_rows = build_issue_rows(grouped_rows, col_map)
    total_issues = len(issue_rows)

    records: list[dict[str, Any]] = []

    for index, issue in enumerate(issue_rows, start=1):
        row_values = issue["row_values"]
        row_number = issue["row_number"]
        registered_topic = normalize_title_text(issue["registered_topic"])
        broadcast_time = clean_text(issue["broadcast_time"])

        issue_note_raw = normalize_note_text(get_cell(row_values, col_map, COL_NOTE))
        final_note_source = issue_note_raw or shared_note

        production_name = build_production_name(
            program_name=program_name,
            registered_topic=registered_topic,
            issue_index=index,
            total_issues=total_issues,
        )

        task_people = build_task_people_for_issue(row_values, col_map)

        note_text = build_issue_note(
            raw_note=final_note_source,
            broadcast_frequency=broadcast_frequency,
            broadcast_time=broadcast_time,
            total_issues=total_issues,
        )

        errors = validate_record(
            production_name=production_name,
            start_date=start_date,
        )

        records.append(
            {
                "source": {
                    "file_name": file_name,
                    "sheet_name": sheet_name,
                    "row_number": row_number,
                    "row_numbers": [row_number],
                    "group_row_numbers": [item[0] for item in grouped_rows],
                    "issue_index": index,
                    "total_issues": total_issues,
                },
                "errors": errors,
                "production": {
                    "name": production_name,
                    "type": production_type,
                    "genre": genre,
                    "duration_minutes": duration_minutes,
                    "start_date": start_date,
                    "end_date": None,
                    "status": DEFAULT_PRODUCTION_STATUS,
                    "notes": note_text,
                },
                "producer_candidate": {
                    "name": producer_name,
                    "department": DEFAULT_EMPLOYEE_DEPARTMENT,
                },
                "task_people": task_people,
            }
        )

    return records


# =========================================================
# XỬ LÝ 1 SOURCE
# =========================================================

def process_one_source(
    df: pd.DataFrame,
    file_name: str,
    sheet_name: Optional[str],
) -> dict[str, Any]:
    headers = build_headers(df)
    col_map = resolve_columns(headers)

    source_month, source_year = extract_month_year(sheet_name=sheet_name, file_name=file_name)

    # File production mẫu chỉ có 1 dòng header
    data_rows = df.iloc[1:].fillna("").values.tolist()

    row_groups, skipped_rows = group_rows_into_records(data_rows, col_map)

    records_valid: list[dict[str, Any]] = []
    records_error: list[dict[str, Any]] = []

    processed_issue_count = 0

    for grouped_rows in row_groups:
        records = transform_group_to_records(
            grouped_rows=grouped_rows,
            col_map=col_map,
            file_name=file_name,
            sheet_name=sheet_name,
            default_month=source_month,
            default_year=source_year,
        )

        processed_issue_count += len(records)

        for record in records:
            if record["errors"]:
                records_error.append(record)
            else:
                records_valid.append(record)

    return {
        "metadata": {
            "file_name": file_name,
            "sheet_name": sheet_name,
            "source_month": source_month,
            "source_year": source_year,
            "total_rows_in_source": len(data_rows),
            "processed_rows": processed_issue_count,
            "valid_rows": len(records_valid),
            "error_rows": len(records_error),
            "skipped_rows": len(skipped_rows),
        },
        "records_valid": records_valid,
        "records_error": records_error,
        "skipped_rows_detail": skipped_rows,
    }


# =========================================================
# CHỐNG TRÙNG
# =========================================================

def deduplicate_valid_records(
    records: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    seen: dict[str, dict[str, Any]] = {}
    deduped: list[dict[str, Any]] = []
    duplicate_rows_detail: list[dict[str, Any]] = []

    for record in records:
        production_name = clean_text(record["production"]["name"]).upper()
        start_date = clean_text(record["production"]["start_date"])
        key = f"{production_name}__{start_date}"

        if not production_name:
            deduped.append(record)
            continue

        if key in seen:
            duplicate_rows_detail.append(
                {
                    "production_name": record["production"]["name"],
                    "current_source": record["source"],
                    "duplicated_with_source": seen[key]["source"],
                    "reason": "Trùng tên production trong cùng tháng của batch import.",
                }
            )
            continue

        seen[key] = record
        deduped.append(record)

    return deduped, duplicate_rows_detail


# =========================================================
# XỬ LÝ NHIỀU FILE / NHIỀU SHEET
# =========================================================

def process_production_files(
    file_paths: list[str],
    read_all_sheets: bool = False,
) -> dict[str, Any]:
    sources = read_import_sources(file_paths, read_all_sheets=read_all_sheets)

    source_results: list[dict[str, Any]] = []
    all_valid_records: list[dict[str, Any]] = []
    all_error_records: list[dict[str, Any]] = []
    all_skipped_rows_detail: list[dict[str, Any]] = []

    total_rows_in_source = 0
    total_processed_rows = 0
    total_valid_rows_before_dedup = 0
    total_error_rows = 0
    total_skipped_rows = 0

    for source in sources:
        result = process_one_source(
            df=source["dataframe"],
            file_name=source["file_name"],
            sheet_name=source["sheet_name"],
        )

        source_results.append(result["metadata"])
        all_valid_records.extend(result["records_valid"])
        all_error_records.extend(result["records_error"])
        all_skipped_rows_detail.extend(
            [
                {
                    "file_name": source["file_name"],
                    "sheet_name": source["sheet_name"],
                    **item,
                }
                for item in result["skipped_rows_detail"]
            ]
        )

        total_rows_in_source += result["metadata"]["total_rows_in_source"]
        total_processed_rows += result["metadata"]["processed_rows"]
        total_valid_rows_before_dedup += result["metadata"]["valid_rows"]
        total_error_rows += result["metadata"]["error_rows"]
        total_skipped_rows += result["metadata"]["skipped_rows"]

    deduped_valid_records, duplicate_rows_detail = deduplicate_valid_records(all_valid_records)

    return {
        "metadata": {
            "module": "productions",
            "total_files": len(file_paths),
            "total_sources": len(sources),
            "total_rows_in_source": total_rows_in_source,
            "processed_rows": total_processed_rows,
            "valid_rows_before_dedup": total_valid_rows_before_dedup,
            "valid_rows_after_dedup": len(deduped_valid_records),
            "error_rows": total_error_rows,
            "skipped_rows": total_skipped_rows,
            "duplicate_rows": len(duplicate_rows_detail),
            "sources": source_results,
        },
        "data": deduped_valid_records,
        "records_error": all_error_records,
        "skipped_rows_detail": all_skipped_rows_detail,
        "duplicate_rows_detail": duplicate_rows_detail,
    }