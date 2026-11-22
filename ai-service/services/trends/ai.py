from processes.prompter import call_llama
from .helpers import extract_json_object, safe_str
from .prompts import build_chart_description_prompt, build_overall_trends_prompt


def analyze_chart_with_ai(chart_id: str, period_label: str, chart_context: dict, extra_rules: list[str] | None = None) -> dict:
    prompt = build_chart_description_prompt(chart_id, period_label, chart_context, extra_rules)

    print(f"Chart prompt length [{chart_id}]:", len(prompt))

    raw = call_llama(prompt)
    parsed = extract_json_object(str(raw))

    if isinstance(parsed, dict):
        return {
            "chart_id": parsed.get("chart_id", chart_id),
            "description_nl": safe_str(parsed.get("description_nl")) or "Er kon geen consistente trendbeschrijving worden gegenereerd.",
            "trend_type": safe_str(parsed.get("trend_type")) or "mixed",
            "severity": safe_str(parsed.get("severity")) or "low",
            "possible_actions": parsed.get("possible_actions", []) if isinstance(parsed.get("possible_actions", []), list) else [],
        }

    return {
        "chart_id": chart_id,
        "description_nl": "Er kon geen consistente trendbeschrijving worden gegenereerd.",
        "trend_type": "mixed",
        "severity": "low",
        "possible_actions": [],
    }


def analyze_overall_trends_with_ai(period_label: str, overall_context: dict, priority_context: dict, extra_rules: list[str] | None = None) -> dict:
    prompt = build_overall_trends_prompt(period_label, overall_context, priority_context, extra_rules)

    print("Overall trends prompt length:", len(prompt))

    raw = call_llama(prompt)
    parsed = extract_json_object(str(raw))

    if isinstance(parsed, dict):
        actions = parsed.get("recommended_actions", [])
        if not isinstance(actions, list):
            actions = []

        normalized_actions = []
        for i, action in enumerate(actions, start=1):
            if isinstance(action, dict):
                normalized_actions.append({
                    "priority": action.get("priority", i),
                    "title": safe_str(action.get("title")) or f"Maatregel {i}",
                    "why": safe_str(action.get("why")) or "",
                    "expected_impact": safe_str(action.get("expected_impact")) or "medium",
                })

        return {
            "summary_nl": safe_str(parsed.get("summary_nl")) or "Er kon geen consistente algemene trendanalyse worden gegenereerd.",
            "highlights": parsed.get("highlights", []) if isinstance(parsed.get("highlights", []), list) else [],
            "risks": parsed.get("risks", []) if isinstance(parsed.get("risks", []), list) else [],
            "recommended_actions": normalized_actions,
        }

    return {
        "summary_nl": "Er kon geen consistente algemene trendanalyse worden gegenereerd.",
        "highlights": [],
        "risks": [],
        "recommended_actions": [],
    }