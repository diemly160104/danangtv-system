from __future__ import annotations
import math
import re
from pathlib import Path
from typing import Any, Optional
from datetime import date, datetime

import pandas as pd


# =========================================================
# REGEX DÙNG CHUNG
# =========================================================

RE_WEIRD_SPACES = re.compile(r"[\u00A0\u200B\u200C\u200D\uFEFF]")
RE_MULTI_SPACES = re.compile(r"\s+")
RE_MONEY_CLEAN = re.compile(r"[^\d,\.\-]")


# ĐỌC FILE

# import 1 file
def read_import_file(file_path: str | Path, sheet_name: int | str = 0) -> pd.DataFrame:
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".csv":
        try:
            return pd.read_csv(path, header=None, dtype=str, encoding="utf-8")
        except UnicodeDecodeError:
            return pd.read_csv(path, header=None, dtype=str, encoding="cp1258")

    if suffix in {".xlsx", ".xls"}:
        return pd.read_excel(path, header=None, dtype=str, sheet_name=sheet_name)

    raise ValueError(f"Định dạng file không hỗ trợ: {suffix}")

# import nhiều nguồn
def read_import_sources(
    file_paths: list[str | Path],
    read_all_sheets: bool = False,
) -> list[dict[str, Any]]:
   
    sources: list[dict[str, Any]] = []

    for file_path in file_paths:
        path = Path(file_path)
        suffix = path.suffix.lower()

        if suffix == ".csv":
            df = read_import_file(path)
            sources.append(
                {
                    "file_path": str(path),
                    "file_name": path.name,
                    "sheet_name": None,
                    "source_name": path.name,
                    "dataframe": df,
                }
            )
            continue

        if suffix in {".xlsx", ".xls"}:
            if read_all_sheets:
                sheet_map = pd.read_excel(path, header=None, dtype=str, sheet_name=None)
                for sheet_name, df in sheet_map.items():
                    sources.append(
                        {
                            "file_path": str(path),
                            "file_name": path.name,
                            "sheet_name": str(sheet_name),
                            "source_name": str(sheet_name),
                            "dataframe": df,
                        }
                    )
            else:
                excel_file = pd.ExcelFile(path)
                first_sheet_name = excel_file.sheet_names[0]
                df = pd.read_excel(path, header=None, dtype=str, sheet_name=first_sheet_name)
                sources.append(
                    {
                        "file_path": str(path),
                        "file_name": path.name,
                        "sheet_name": first_sheet_name,
                        "source_name": str(first_sheet_name),
                        "dataframe": df,
                    }
                )
            continue

        raise ValueError(f"Định dạng file không hỗ trợ: {suffix}")

    return sources



# XỬ LÝ TEXT

# Kiểm tra giá trị rỗng 
def is_blank(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, float) and math.isnan(value):
        return True
    return str(value).strip() == ""

# Xử Lý text (Khoảng trắng, kí tự lạ, Viết hoa đầu dòng)
def clean_text(value: Any, uppercase_first: bool = False) -> str:

    if is_blank(value):
        return ""

    text = str(value)
    text = RE_WEIRD_SPACES.sub(" ", text)
    text = text.replace("\r", " ").replace("\n", " ").replace("\t", " ")
    text = RE_MULTI_SPACES.sub(" ", text).strip()

    if not text:
        return ""

    if uppercase_first:
        return text[:1].upper() + text[1:]

    return text

# Xử lý tên (kí tự lạ, khoảng trắng, viết hoa tên)
def clean_person_name(value: Any) -> str:
    text = clean_text(value, uppercase_first=False)
    if not text:
        return ""

    words = []
    for word in text.split(" "):
        if not word:
            continue
        words.append(word[:1].upper() + word[1:].lower())

    return " ".join(words).strip()



# XỬ LÝ NGÀY THÁNG NĂM

# lấy tháng năm từ tên sheet/ file 
def extract_month_year_from_text(value: Any) -> tuple[Optional[int], Optional[int]]:
    """
    Lấy tháng/năm từ text như:
    - Tháng 7.2025
    - Tháng 7/2025
    - tháng 7-2025
    - tháng 7 năm 2025
    - 7.2025
    """
    text = clean_text(value)
    if not text:
        return None, None

    text_lower = text.lower()

    # Chuẩn hóa các cách viết về dạng dễ bắt hơn
    text_lower = text_lower.replace("năm", "/")
    text_lower = text_lower.replace("-", "/")
    text_lower = text_lower.replace(".", "/")

    # Bỏ chữ "tháng" / "thang"
    text_lower = text_lower.replace("tháng", "")
    text_lower = text_lower.replace("thang", "")

    # Gọn khoảng trắng
    text_lower = " ".join(text_lower.split()).strip()

    # Ví dụ sau chuẩn hóa:
    # "Tháng 7.2025" -> "7/2025"
    # "Tháng 7 năm 2025" -> "7 / 2025"

    match = re.search(r"(\d{1,2})\s*/\s*(\d{4})", text_lower)
    if not match:
        return None, None

    month = int(match.group(1))
    year = int(match.group(2))

    if 1 <= month <= 12 and 1900 <= year <= 2100:
        return month, year

    return None, None


def extract_month_year(sheet_name: Optional[str], file_name: Optional[str]) -> tuple[Optional[int], Optional[int]]:
    month, year = extract_month_year_from_text(sheet_name)

    if month is not None and year is not None:
        return month, year

    month, year = extract_month_year_from_text(file_name)
    
    return month, year



# Xử lý ngày tháng (nếu đủ --> dùng luôn, thiếu tháng năm --> lấy từ hàm trên, thiếu ngày --> none)
def parse_contract_date(
    value: Any,
    default_month: Optional[int] = None,
    default_year: Optional[int] = None,
) -> Optional[str]:
    if value is None:
        return None

    # Trường hợp là datetime / Timestamp thật
    if isinstance(value, pd.Timestamp):
        return value.date().isoformat()

    if isinstance(value, datetime):
        return value.date().isoformat()

    if isinstance(value, date):
        return value.isoformat()

    text = clean_text(value)
    if not text:
        return None

    # 1) Dạng Excel/string ISO: 2025-07-01 hoặc 2025-07-01 00:00:00
    match = re.match(
        r"^\s*(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+\d{1,2}:\d{1,2}(?::\d{1,2})?)?\s*$",
        text,
    )
    if match:
        year = int(match.group(1))
        month = int(match.group(2))
        day = int(match.group(3))
        try:
            return date(year, month, day).isoformat()
        except ValueError:
            return None

    # Chuẩn hóa các dấu phân cách
    normalized = text.replace("\\", "/").replace(".", "/").replace("-", "/")
    normalized = re.sub(r"\s+", "", normalized)

    # 2) Dạng dd/mm/yyyy hoặc dd/mm/yy
    match = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{2,4})$", normalized)
    if match:
        day = int(match.group(1))
        month = int(match.group(2))
        year = int(match.group(3))

        if year < 100:
            year += 2000

        try:
            return date(year, month, day).isoformat()
        except ValueError:
            return None

    # 3) Dạng dd/mm -> lấy năm từ sheet/file
    match = re.match(r"^(\d{1,2})/(\d{1,2})$", normalized)
    if match:
        day = int(match.group(1))
        month = int(match.group(2))

        if default_year is None:
            return None

        try:
            return date(default_year, month, day).isoformat()
        except ValueError:
            return None

    # 4) Dạng chỉ có ngày dd -> lấy cả tháng và năm từ sheet/file
    match = re.match(r"^(\d{1,2})$", normalized)
    if match:
        day = int(match.group(1))

        if default_month is None or default_year is None:
            return None

        try:
            return date(default_year, default_month, day).isoformat()
        except ValueError:
            return None

    # 5) Các dạng kiểu "..../7/2025" vẫn coi là thiếu ngày -> None
    return None

# XỬ LÝ TIỀN

def parse_money(value: Any) -> Optional[float]:
    text = clean_text(value)

    if not text:
        return None

    cleaned = RE_MONEY_CLEAN.sub("", text)

    if not cleaned:
        return None

    # Có cả . và ,
    if "." in cleaned and "," in cleaned:
        if cleaned.rfind(",") > cleaned.rfind("."):
            # ví dụ 1.234.567,89
            cleaned = cleaned.replace(".", "").replace(",", ".")
        else:
            # ví dụ 1,234,567.89
            cleaned = cleaned.replace(",", "")

    # Chỉ có dấu phẩy
    elif "," in cleaned:
        # Nếu phần sau dấu phẩy có đúng 3 chữ số, coi là ngăn cách hàng nghìn
        parts = cleaned.split(",")
        if len(parts) > 1 and all(part.isdigit() for part in parts):
            if all(len(part) == 3 for part in parts[1:]):
                cleaned = "".join(parts)
            else:
                cleaned = cleaned.replace(",", ".")
        else:
            cleaned = cleaned.replace(",", ".")

    # Chỉ có dấu chấm
    elif "." in cleaned:
        parts = cleaned.split(".")
        if len(parts) > 1 and all(part.isdigit() for part in parts):
            if all(len(part) == 3 for part in parts[1:]):
                cleaned = "".join(parts)

    try:
        return float(cleaned)
    except ValueError:
        return None
    
#  Xử lý tiền, nếu rỗng thì trả về 0
def money_or_zero(value: Any) -> float:
    parsed = parse_money(value)
    return parsed if parsed is not None else 0.0


# Hàm tổng hợp tài chính hợp đồng 
def calculate_contract_financials(
    contract_value: Any,
    acceptance_value: Any,
    paid_value: Any,
    remaining_value: Any = None,
) -> dict[str, float | str]:

    contract_val = max(money_or_zero(contract_value), 0.0)
    acceptance_val = money_or_zero(acceptance_value)
    paid_val = money_or_zero(paid_value)
    remaining_val = parse_money(remaining_value)

    total_val = acceptance_val if acceptance_val > 0 else contract_val
    discount_val = contract_val - acceptance_val if acceptance_val > 0 and acceptance_val < contract_val else 0.0

    if paid_val <= 0 and remaining_val is not None and total_val > 0:
        paid_val = max(total_val - remaining_val, 0.0)

    if remaining_val is None:
        remaining_val = max(total_val - paid_val, 0.0)

    if total_val > 0 and paid_val >= total_val:
        payment_status = "paid"
    elif paid_val > 0:
        payment_status = "partial"
    else:
        payment_status = "planned"

    return {
        "contract_value": float(contract_val),
        "discount": float(discount_val),
        "total_value": float(total_val),
        "paid_value": float(paid_val),
        "remaining_payment": float(remaining_val),
        "payment_status": payment_status,
    }


