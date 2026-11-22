from collections import Counter
from statistics import mean


def top_counter_items(counter: Counter, limit: int = 10, min_count: int = 1):
    result = []

    for label, count in counter.most_common():
        if count < min_count:
            continue
        result.append({"label": label, "count": count})
        if len(result) >= limit:
            break

    return result


def top_combo_items(counter: Counter, key_names: list[str], limit: int = 10, min_count: int = 1):
    result = []

    for combo, count in counter.most_common():
        if count < min_count:
            continue

        row = {}
        for i, key_name in enumerate(key_names):
            row[key_name] = combo[i]
        row["count"] = count
        result.append(row)

        if len(result) >= limit:
            break

    return result


def build_series_stats(series: list[dict]) -> dict:
    values = [item["value"] for item in series if isinstance(item.get("value"), (int, float))]

    if not values:
        return {
            "total": 0,
            "average": 0,
            "max": 0,
            "max_label": None,
            "min": 0,
            "min_label": None,
            "peak_count": 0,
            "peaks": [],
            "trend_direction": "mixed",
        }

    avg = mean(values)
    max_item = max(series, key=lambda x: x["value"])
    min_item = min(series, key=lambda x: x["value"])

    peaks = []
    for item in series:
        value = item["value"]
        if avg > 0 and value >= avg * 1.3 and value >= avg + 2:
            peaks.append({
                "label": item["label"],
                "value": value,
                "deviation_pct": round(((value - avg) / avg) * 100, 1)
            })

    trend_direction = "mixed"
    if len(values) >= 2:
        first = values[0]
        last = values[-1]
        if first == 0 and last > 0:
            trend_direction = "increase"
        elif last > first * 1.1:
            trend_direction = "increase"
        elif last < first * 0.9:
            trend_direction = "decrease"
        else:
            trend_direction = "stable"

    return {
        "total": sum(values),
        "average": round(avg, 2),
        "max": max_item["value"],
        "max_label": max_item["label"],
        "min": min_item["value"],
        "min_label": min_item["label"],
        "peak_count": len(peaks),
        "peaks": peaks[:10],
        "trend_direction": trend_direction,
    }


def top_descriptions_from_tickets(tickets: list[dict], limit: int = 10):
    counter = Counter(ticket["briefDescriptionAI"] for ticket in tickets if ticket["briefDescriptionAI"])
    return top_counter_items(counter, limit=limit)


def top_systems_from_tickets(tickets: list[dict], limit: int = 10):
    counter = Counter()
    for ticket in tickets:
        for system in ticket["systems"]:
            counter[system] += 1
    return top_counter_items(counter, limit=limit)


def top_issue_types_from_tickets(tickets: list[dict], limit: int = 10):
    counter = Counter()
    for ticket in tickets:
        for issue_type in ticket["issue_types"]:
            counter[issue_type] += 1
    return top_counter_items(counter, limit=limit)


def build_chart_context(chart_id: str, global_context: dict) -> dict:
    if chart_id == "tickets-over-period":
        series = [
            {"label": label, "value": count}
            for label, count in sorted(global_context["per_day"].items())
            if label != "unknown"
        ]
        stats = build_series_stats(series)

        peak_day_context = []
        for peak in stats.get("peaks", [])[:5]:
            day_tickets = global_context["day_to_tickets"].get(peak["label"], [])
            peak_day_context.append({
                "day": peak["label"],
                "ticket_count": peak["value"],
                "top_systems": top_systems_from_tickets(day_tickets, limit=5),
                "top_issue_types": top_issue_types_from_tickets(day_tickets, limit=5),
                "top_descriptions": top_descriptions_from_tickets(day_tickets, limit=5),
            })

        return {
            "chart_id": chart_id,
            "series": series,
            "stats": stats,
            "top_descriptions": top_counter_items(global_context["per_description"], limit=10),
            "top_systems": top_counter_items(global_context["per_system"], limit=10),
            "top_issue_types": top_counter_items(global_context["per_issue_type"], limit=10),
            "peak_day_context": peak_day_context,
        }

    if chart_id == "tickets-per-category":
        series = [{"label": label, "value": count} for label, count in global_context["per_category"].most_common()]
        stats = build_series_stats(series)

        category_context = []
        for label, count in global_context["per_category"].most_common(10):
            subset = global_context["category_to_tickets"].get(label, [])
            category_context.append({
                "category": label,
                "ticket_count": count,
                "top_systems": top_systems_from_tickets(subset, limit=5),
                "top_issue_types": top_issue_types_from_tickets(subset, limit=5),
                "top_descriptions": top_descriptions_from_tickets(subset, limit=5),
            })

        return {"chart_id": chart_id, "series": series, "stats": stats, "category_context": category_context}

    if chart_id == "tickets-by-entry-type":
        series = [{"label": label, "value": count} for label, count in global_context["per_entry_type"].most_common()]
        stats = build_series_stats(series)

        entry_context = []
        for label, count in global_context["per_entry_type"].most_common(10):
            subset = global_context["entry_type_to_tickets"].get(label, [])
            entry_context.append({
                "entry_type": label,
                "ticket_count": count,
                "top_systems": top_systems_from_tickets(subset, limit=5),
                "top_issue_types": top_issue_types_from_tickets(subset, limit=5),
                "top_descriptions": top_descriptions_from_tickets(subset, limit=5),
            })

        return {"chart_id": chart_id, "series": series, "stats": stats, "entry_type_context": entry_context}

    if chart_id == "tickets-by-location":
        series = [{"label": label, "value": count} for label, count in global_context["per_location"].most_common()]
        stats = build_series_stats(series)

        location_context = []
        for label, count in global_context["per_location"].most_common(10):
            subset = global_context["location_to_tickets"].get(label, [])
            location_context.append({
                "location": label,
                "ticket_count": count,
                "top_systems": top_systems_from_tickets(subset, limit=5),
                "top_issue_types": top_issue_types_from_tickets(subset, limit=5),
                "top_descriptions": top_descriptions_from_tickets(subset, limit=5),
            })

        return {
            "chart_id": chart_id,
            "series": series,
            "stats": stats,
            "location_context": location_context,
            "top_location_system": top_combo_items(global_context["location_system_combo"], ["location", "system"], limit=15),
            "top_location_issue": top_combo_items(global_context["location_issue_combo"], ["location", "issue_type"], limit=15),
            "top_location_system_issue": top_combo_items(global_context["location_system_issue_combo"], ["location", "system", "issue_type"], limit=20),
        }

    if chart_id == "tickets-by-system-involved":
        series = [{"label": label, "value": count} for label, count in global_context["per_system"].most_common()]
        stats = build_series_stats(series)

        system_context = []
        for label, count in global_context["per_system"].most_common(10):
            subset = global_context["system_to_tickets"].get(label, [])
            system_context.append({
                "system": label,
                "ticket_count": count,
                "top_issue_types": top_issue_types_from_tickets(subset, limit=5),
                "top_descriptions": top_descriptions_from_tickets(subset, limit=5),
            })

        return {
            "chart_id": chart_id,
            "series": series,
            "stats": stats,
            "system_context": system_context,
            "top_combinations": top_combo_items(global_context["system_issue_combo"], ["system", "issue_type"], limit=15),
        }

    if chart_id == "tickets-by-issue_type":
        series = [{"label": label, "value": count} for label, count in global_context["per_issue_type"].most_common()]
        stats = build_series_stats(series)

        issue_type_context = []
        for label, count in global_context["per_issue_type"].most_common(10):
            subset = global_context["issue_type_to_tickets"].get(label, [])
            issue_type_context.append({
                "issue_type": label,
                "ticket_count": count,
                "top_systems": top_systems_from_tickets(subset, limit=5),
                "top_descriptions": top_descriptions_from_tickets(subset, limit=5),
            })

        return {
            "chart_id": chart_id,
            "series": series,
            "stats": stats,
            "issue_type_context": issue_type_context,
            "top_combinations": top_combo_items(global_context["system_issue_combo"], ["system", "issue_type"], limit=15),
        }

    raise ValueError(f"Unsupported chart_id: {chart_id}")