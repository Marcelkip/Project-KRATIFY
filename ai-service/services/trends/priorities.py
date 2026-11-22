from .charts import top_combo_items


def build_overall_trends_context(global_context: dict) -> dict:
    return {
        "total_tickets": len(global_context["normalized_tickets"]),
        "tickets_per_day": [{"label": label, "count": count} for label, count in sorted(global_context["per_day"].items()) if label != "unknown"],
        "top_categories": [{"label": label, "count": count} for label, count in global_context["per_category"].most_common(10)],
        "top_entry_types": [{"label": label, "count": count} for label, count in global_context["per_entry_type"].most_common(10)],
        "top_locations": [{"label": label, "count": count} for label, count in global_context["per_location"].most_common(10)],
        "top_systems": [{"label": label, "count": count} for label, count in global_context["per_system"].most_common(10)],
        "top_issue_types": [{"label": label, "count": count} for label, count in global_context["per_issue_type"].most_common(10)],
        "top_descriptions": [{"label": label, "count": count} for label, count in global_context["per_description"].most_common(15)],
        "top_system_issue_combinations": top_combo_items(global_context["system_issue_combo"], ["system", "issue_type"], limit=15),
        "top_system_description_combinations": top_combo_items(global_context["system_description_combo"], ["system", "description"], limit=15),
        "top_issue_description_combinations": top_combo_items(global_context["issue_description_combo"], ["issue_type", "description"], limit=15),
        "top_location_system": top_combo_items(global_context["location_system_combo"], ["location", "system"], limit=15),
        "top_location_issue": top_combo_items(global_context["location_issue_combo"], ["location", "issue_type"], limit=15),
        "top_location_system_issue": top_combo_items(global_context["location_system_issue_combo"], ["location", "system", "issue_type"], limit=20),
        "top_department_system": top_combo_items(global_context["department_system_combo"], ["department", "system"], limit=15),
        "top_department_issue": top_combo_items(global_context["department_issue_combo"], ["department", "issue_type"], limit=15),
        "top_role_issue": top_combo_items(global_context["role_issue_combo"], ["role", "issue_type"], limit=15),
    }


def build_action_priority_context(global_context: dict) -> dict:
    location_totals = global_context["per_location"]
    system_totals = global_context["per_system"]
    issue_totals = global_context["per_issue_type"]

    prioritized_items = []

    for (location, system, issue_type), count in global_context["location_system_issue_combo"].most_common(25):
        location_weight = max(location_totals.get(location, 1), 1)
        system_weight = max(system_totals.get(system, 1), 1)
        issue_weight = max(issue_totals.get(issue_type, 1), 1)

        score = round((count * 4) + (location_weight * 0.5) + (system_weight * 0.3) + (issue_weight * 0.3), 2)

        prioritized_items.append({
            "level": "location_system_issue",
            "location": location,
            "system": system,
            "issue_type": issue_type,
            "count": count,
            "location_total": location_weight,
            "system_total": system_weight,
            "issue_total": issue_weight,
            "impact_score": score
        })

    for (location, system), count in global_context["location_system_combo"].most_common(20):
        location_weight = max(location_totals.get(location, 1), 1)
        system_weight = max(system_totals.get(system, 1), 1)

        score = round((count * 3) + (location_weight * 0.5) + (system_weight * 0.4), 2)

        prioritized_items.append({
            "level": "location_system",
            "location": location,
            "system": system,
            "count": count,
            "location_total": location_weight,
            "system_total": system_weight,
            "impact_score": score
        })

    for (system, issue_type), count in global_context["system_issue_combo"].most_common(20):
        system_weight = max(system_totals.get(system, 1), 1)
        issue_weight = max(issue_totals.get(issue_type, 1), 1)

        score = round((count * 2.5) + (system_weight * 0.5) + (issue_weight * 0.5), 2)

        prioritized_items.append({
            "level": "system_issue",
            "system": system,
            "issue_type": issue_type,
            "count": count,
            "system_total": system_weight,
            "issue_total": issue_weight,
            "impact_score": score
        })

    prioritized_items.sort(key=lambda x: x["impact_score"], reverse=True)

    return {
        "top_prioritized_patterns": prioritized_items[:20]
    }