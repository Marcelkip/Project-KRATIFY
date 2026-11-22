import json
from datetime import datetime


# Andere manier van var or ""
def safe_str(value):
    if value is None:
        return ""
    return str(value).strip()


def safe_list(value):
    if value is None:
        return []

    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]

    if isinstance(value, str):
        value = value.strip()
        if not value:
            return []

        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(v).strip() for v in parsed if str(v).strip()]
        except Exception:
            pass

        return [value]

    return []


# Remove duplicate values in array but make sure the first time a value appears it stays at that position
# ["test", "dupe", "test3", "dupe", "test2"]
# -> ["test", "dupe", "test3", "test2"]
def dedupe_keep_order(items):
    seen = set()
    result = []

    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)

    return result


def parse_date(value):
    if not value:
        return None

    value = str(value).strip()

    formats = [
        "%Y-%m-%d",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%S.%fZ",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


# Used to tell the AI during what period the report is made.
# Reports use ISO due to topdesk documentation. But python (based on my research) does not support Z inside iso.
def format_period_label(startDate: str, endDate: str) -> str:
    start = datetime.fromisoformat(startDate.replace("Z", "+00:00"))
    end = datetime.fromisoformat(endDate.replace("Z", "+00:00"))

    return f"{start.strftime('%d/%m/%Y')} t/m {end.strftime('%d/%m/%Y')}"

# AI's return text
# This checks if valid json is given and removes the "/' to make it functional json
def extract_json_object(raw: str) -> dict | None:
    if not raw:
        return None

    raw = raw.strip()

    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return data
    except Exception:
        pass

    start = raw.find("{")
    end = raw.rfind("}")

    if start == -1 or end == -1 or end <= start:
        return None

    try:
        data = json.loads(raw[start:end + 1])
        if isinstance(data, dict):
            return data
    except Exception:
        return None

    return None