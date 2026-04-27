from __future__ import annotations

# import json
# from pathlib import Path
from typing import Any, Optional

import pandas as pd

from common import (
    calculate_contract_financials,
    clean_person_name,
    clean_text,
    extract_month_year,
    is_blank,
    parse_money,
    parse_contract_date,
    read_import_sources,
)


# TÊN CỘT 

COL_SO_TT = "STT"
COL_NGUOI_THUC_HIEN = "Người thực hiện"
COL_NGAY_KY_HD = "Ngày ký HĐ"
COL_SO_HOP_DONG = "Số hợp đồng"
COL_TEN_DON_VI = "Tên đơn vị"
COL_GIA_TRI_HOP_DONG = "Giá trị hợp đồng"

COL_TUYEN_TRUYEN = "Tuyên truyền"
COL_TBQC_PTTH = "TB-QC-TTrợ (PT-TH)"
COL_TBQC_BAO_IN = "TB-QC-TTrợ (Báo in-BĐT)"
COL_BAN_BAO = "Bán báo"
COL_KHAC = "Khác"

COL_NGHIEM_THU = "Nghiệm thu-thanh lý"
COL_DA_THANH_TOAN = "Đã thanh toán"
COL_CON_LAI = "Còn lại chưa thanh toán"
COL_GHI_CHU = "Ghi chú"



# TÊN MỤC DỊCH VỤ ĐẦY ĐỦ

SERVICE_ITEM_TUYEN_TRUYEN = "Tuyên truyền (Phát thanh - Truyền hình)"
SERVICE_ITEM_TBQC_PTTH = "Thông báo - Quảng cáo - Tài trợ (Phát thanh truyền hình)"
SERVICE_ITEM_TBQC_BAO_IN = "Thông báo - Quảng cáo - Tài trợ (Báo in)"
SERVICE_ITEM_BAN_BAO = "Bán báo"
SERVICE_ITEM_KHAC = "Khác"



CONTRACT_TYPE_SERVICE = "service"
CONTRACT_TYPE_LICENSE_PURCHASE = "license_purchase"
CONTRACT_TYPE_OTHER = "other"


def normalize_contract_type(value: Any) -> str:
    text = clean_text(value).lower()

    if text in {
        CONTRACT_TYPE_SERVICE,
        CONTRACT_TYPE_LICENSE_PURCHASE,
        CONTRACT_TYPE_OTHER,
    }:
        return text

    return CONTRACT_TYPE_SERVICE


def build_contract_title(party_name: str, contract_type: str) -> str:
    prefix_map = {
        CONTRACT_TYPE_SERVICE: "Hợp đồng dịch vụ",
        CONTRACT_TYPE_LICENSE_PURCHASE: "Hợp đồng mua bản quyền",
        CONTRACT_TYPE_OTHER: "Hợp đồng khác",
    }

    prefix = prefix_map.get(contract_type, "Hợp đồng")

    if party_name:
        return f"{prefix} - {party_name}"

    return prefix


def build_contract_note(
    note_value: Any,
    person_in_charge: Any,
    default_person_in_charge: str = "Phòng Tài chính - Dịch vụ",
) -> str:
    note_text = clean_text(note_value, uppercase_first=True)
    person_text = clean_person_name(person_in_charge)

    if not person_text:
        person_text = default_person_in_charge

    person_line = f"Người phụ trách dự án: {person_text}"

    if note_text:
        return f"{note_text}\n{person_line}"

    return person_line

# HEADER

def build_headers(df: pd.DataFrame) -> list[str]:
    row_1 = df.iloc[0].fillna("").tolist() if len(df) > 0 else []
    row_2 = df.iloc[1].fillna("").tolist() if len(df) > 1 else []

    max_len = max(len(row_1), len(row_2))
    headers: list[str] = []

    for i in range(max_len):
        top = clean_text(row_1[i] if i < len(row_1) else "")
        bottom = clean_text(row_2[i] if i < len(row_2) else "")

        if top == "Trong đó" and bottom:
            headers.append(bottom)
        elif top:
            headers.append(top)
        else:
            headers.append(bottom)

    return headers


def resolve_columns(headers: list[str]) -> dict[str, int]:
    mapping: dict[str, int] = {}
    for idx, header in enumerate(headers):
        mapping[header] = idx
    return mapping



# HÀM LẤY GIÁ TRỊ THEO TÊN CỘT

def get_cell(row_values: list[Any], col_map: dict[str, int], column_name: str) -> Any:
    idx = col_map.get(column_name)
    if idx is None or idx >= len(row_values):
        return ""
    return row_values[idx]



# BỎ QUA DÒNG KHÔNG PHẢI DỮ LIỆU

def is_empty_row(row_values: list[Any]) -> bool:
    return all(is_blank(value) for value in row_values)


def should_skip_row(row_values: list[Any], col_map: dict[str, int]) -> tuple[bool, str]:
 
    if is_empty_row(row_values):
        return True, "Dòng rỗng."

    so_tt = clean_text(get_cell(row_values, col_map, COL_SO_TT))
    ten_don_vi = clean_text(get_cell(row_values, col_map, COL_TEN_DON_VI))
    so_hop_dong = clean_text(get_cell(row_values, col_map, COL_SO_HOP_DONG))

    if so_tt.lower() in {"cộng", "tong cong", "tổng cộng"}:
        return True, "Dòng tổng hợp."

    if not ten_don_vi and not so_hop_dong:
        return True, "Không có tên đơn vị và không có mã hợp đồng."

    return False, ""

# SERVICE ITEMS

def build_service_items(row_values: list[Any], col_map: dict[str, int]) -> list[dict[str, Any]]:
    service_items: list[dict[str, Any]] = []

    service_columns = [
        (COL_TUYEN_TRUYEN, SERVICE_ITEM_TUYEN_TRUYEN, "tv_ad"),
        (COL_TBQC_PTTH, SERVICE_ITEM_TBQC_PTTH, "tv_ad"),
        (COL_TBQC_BAO_IN, SERVICE_ITEM_TBQC_BAO_IN, "printed_ad"),
        (COL_BAN_BAO, SERVICE_ITEM_BAN_BAO, "other"),
        (COL_KHAC, SERVICE_ITEM_KHAC, "other"),
    ]

    for column_name, full_title, service_type in service_columns:
        amount = parse_money(get_cell(row_values, col_map, column_name))
        if amount is None or amount <= 0:
            continue

        service_items.append(
            {
                "title": full_title,
                "service_type": service_type,
                "cost": amount,
                "status": "planned",
                "notes": f"{column_name}",
                "bookings": [],
            }
        )

    return service_items


# =========================================================
# VALIDATE DÒNG DỮ LIỆU
# =========================================================

def validate_record(
    contract_number: str,
    signed_date: Optional[str],
    party_name: str,
    contract_value: float,
    service_items: list[dict[str, Any]],
) -> list[str]:
    errors: list[str] = []

    if not contract_number:
        errors.append("Thiếu mã hợp đồng.")

    if not signed_date:
        errors.append("Ngày ký hợp đồng không hợp lệ hoặc thiếu ngày.")

    if not party_name:
        errors.append("Thiếu tên đơn vị.")

    if contract_value <= 0:
        errors.append("Giá trị hợp đồng phải lớn hơn 0.")

    return errors


# CHUYỂN 1 DÒNG THÀNH RECORD IMPORT

def transform_row_to_record(
    row_values: list[Any],
    col_map: dict[str, int],
    file_name: str,
    sheet_name: Optional[str],
    row_number: int,
    default_month: Optional[int],
    default_year: Optional[int],
    selected_contract_type: str,
) -> dict[str, Any]:

    contract_number = clean_text(get_cell(row_values, col_map, COL_SO_HOP_DONG))
    party_name = clean_text(get_cell(row_values, col_map, COL_TEN_DON_VI), uppercase_first=True)
    normalized_contract_type = normalize_contract_type(selected_contract_type)
    raw_note = clean_text(get_cell(row_values, col_map, COL_GHI_CHU), uppercase_first=True)
    person_in_charge_name = clean_person_name(get_cell(row_values, col_map, COL_NGUOI_THUC_HIEN))

    signed_date = parse_contract_date(
        get_cell(row_values, col_map, COL_NGAY_KY_HD),
        default_month=default_month,
        default_year=default_year,
    )

    financials = calculate_contract_financials(
        contract_value=get_cell(row_values, col_map, COL_GIA_TRI_HOP_DONG),
        acceptance_value=get_cell(row_values, col_map, COL_NGHIEM_THU),
        paid_value=get_cell(row_values, col_map, COL_DA_THANH_TOAN),
        remaining_value=get_cell(row_values, col_map, COL_CON_LAI),
    )

    service_items = build_service_items(row_values, col_map)

    errors = validate_record(
        contract_number=contract_number,
        signed_date=signed_date,
        party_name=party_name,
        contract_value=float(financials["contract_value"]),
        service_items=service_items,
    )

    note_text = build_contract_note(
        note_value=raw_note,
        person_in_charge=person_in_charge_name,
        default_person_in_charge="Phòng Tài chính & Dịch vụ",
    )
    
    return {
        "source": {
            "file_name": file_name,
            "sheet_name": sheet_name,
            "row_number": row_number,
        },
        "errors": errors,
        "party": {
            "party_type": "customer",
            "customer_type": "corporate",
            "name": party_name,
            "company": party_name,
            "phone_number": "",
            "email": "",
            "address": "",
            "account_number": "",
            "bank": "",
            "tax_code": "",
            "notes": "",
        },
        "person_in_charge_candidate": {
            "name": person_in_charge_name,
            "department": "finance_services",
        } if person_in_charge_name else None,
        "contract": {
            "contract_number": contract_number,
            "title": build_contract_title(party_name, normalized_contract_type),
            "contract_type": normalized_contract_type,
            "signed_date": signed_date,
            "start_date": signed_date,
            "end_date": None,
            "contract_value": float(financials["contract_value"]),
            "discount": float(financials["discount"]),
            "total_value": float(financials["total_value"]),
            "status": "active",
            "notes": note_text,
        },
        "service_items": service_items,
        "payment_schedule": {
            "installment_no": 1,
            "due_date": signed_date,
            "planned_amount": float(financials["total_value"]),
            "status": str(financials["payment_status"]),
            "notes": (
                f"Nghiệm thu-thanh lý: {clean_text(get_cell(row_values, col_map, COL_NGHIEM_THU))}; "
                f"Đã thanh toán: {clean_text(get_cell(row_values, col_map, COL_DA_THANH_TOAN))}; "
                f"Còn lại chưa thanh toán: {clean_text(get_cell(row_values, col_map, COL_CON_LAI))}"
            ),
        },
    }


# XỬ LÝ 1 SOURCE


def process_one_source(
    df: pd.DataFrame,
    file_name: str,
    sheet_name: Optional[str],
    selected_contract_type: str,
) -> dict[str, Any]:

    headers = build_headers(df)
    col_map = resolve_columns(headers)

    source_month, source_year = extract_month_year(sheet_name=sheet_name, file_name=file_name)

    data_rows = df.iloc[2:].fillna("").values.tolist()

    records_valid: list[dict[str, Any]] = []
    records_error: list[dict[str, Any]] = []
    skipped_rows: list[dict[str, Any]] = []

    total_data_rows = 0

    for row_idx, row_values in enumerate(data_rows, start=3):
        skip, reason = should_skip_row(row_values, col_map)

        if skip:
            skipped_rows.append(
                {
                    "row_number": row_idx,
                    "reason": reason,
                }
            )
            continue

        total_data_rows += 1

        record = transform_row_to_record(
            row_values=row_values,
            col_map=col_map,
            file_name=file_name,
            sheet_name=sheet_name,
            row_number=row_idx,
            default_month=source_month,
            default_year=source_year,
            selected_contract_type=selected_contract_type,
        )

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
            "processed_rows": total_data_rows,
            "valid_rows": len(records_valid),
            "error_rows": len(records_error),
            "skipped_rows": len(skipped_rows),
        },
        "records_valid": records_valid,
        "records_error": records_error,
        "skipped_rows_detail": skipped_rows,
    }


# =========================================================
# CHỐNG TRÙNG TRONG CÙNG BATCH IMPORT THEO MÃ HỢP ĐỒNG
# =========================================================

def deduplicate_valid_records(records: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
 
    seen: dict[str, dict[str, Any]] = {}
    deduped: list[dict[str, Any]] = []
    duplicate_rows_detail: list[dict[str, Any]] = []

    for record in records:
        contract_number = record["contract"]["contract_number"]

        if not contract_number:
            deduped.append(record)
            continue

        key = contract_number.strip().upper()

        if key in seen:
            duplicate_rows_detail.append(
                {
                    "contract_number": contract_number,
                    "current_source": record["source"],
                    "duplicated_with_source": seen[key]["source"],
                    "reason": "Trùng mã hợp đồng trong cùng batch import.",
                }
            )
            continue

        seen[key] = record
        deduped.append(record)

    return deduped, duplicate_rows_detail

# XỬ LÝ NHIỀU FILE / NHIỀU SHEET


def process_contract_service_files(
    file_paths: list[str],
    read_all_sheets: bool = False,
    selected_contract_type: str = "service",
) -> dict[str, Any]:
    
    selected_contract_type = normalize_contract_type(selected_contract_type)

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
            selected_contract_type=selected_contract_type,
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

    output = {
        "metadata": {
            "module": "contracts",
            "contract_type": selected_contract_type,
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
    }

    return output


# =========================================================
# GHI KẾT QUẢ RA FILE JSON
# =========================================================

# def find_set_paths(obj: Any, path: str = "root") -> list[str]:
#     """
#     Tìm tất cả đường dẫn trong object đang có kiểu set.
#     """
#     found: list[str] = []

#     if isinstance(obj, set):
#         found.append(path)
#         return found

#     if isinstance(obj, dict):
#         for key, value in obj.items():
#             found.extend(find_set_paths(value, f"{path}.{key}"))
#         return found

#     if isinstance(obj, list):
#         for index, value in enumerate(obj):
#             found.extend(find_set_paths(value, f"{path}[{index}]"))
#         return found

#     return found


# def make_json_safe(obj: Any) -> Any:
#     """
#     Chuyển object về dạng ghi được JSON.
#     - set -> list
#     - dict/list -> xử lý đệ quy
#     """
#     if isinstance(obj, set):
#         return list(obj)

#     if isinstance(obj, dict):
#         return {key: make_json_safe(value) for key, value in obj.items()}

#     if isinstance(obj, list):
#         return [make_json_safe(value) for value in obj]

#     return obj

# def write_contract_service_json_output(
#     file_paths: list[str],
#     output_path: str | Path,
#     read_all_sheets: bool = False,
#     selected_contract_type: str = "service",
# ) -> dict[str, Any]:
#     """
#     Chạy ETL và ghi kết quả ra file JSON.
#     """
#     result = process_contract_service_files(
#         file_paths=file_paths,
#         read_all_sheets=read_all_sheets,
#         selected_contract_type=selected_contract_type,
#     )

#     set_paths = find_set_paths(result)
#     if set_paths:
#         print("Phát hiện kiểu set ở các vị trí sau:")
#         for item in set_paths:
#             print("-", item)

#     safe_result = make_json_safe(result)

#     output_file = Path(output_path)
#     output_file.parent.mkdir(parents=True, exist_ok=True)
#     output_file.write_text(
#         json.dumps(safe_result, ensure_ascii=False, indent=2),
#         encoding="utf-8",
#     )

#     return safe_result