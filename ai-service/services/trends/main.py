from .helpers import format_period_label
from .context_builder import build_global_ticket_context
from .charts import build_chart_context
from .priorities import build_overall_trends_context, build_action_priority_context
from .ai import analyze_chart_with_ai, analyze_overall_trends_with_ai
from .config import CHART_IDS


def generate_chart_analysis(tickets: list[dict], chart_id: str, startDate: str, endDate: str, extra_rules: list[str] | None = None) -> dict:
    period_label = format_period_label(startDate, endDate)
    global_context = build_global_ticket_context(tickets)
    chart_context = build_chart_context(chart_id, global_context)

    return analyze_chart_with_ai(chart_id, period_label, chart_context, extra_rules)


def generate_all_chart_analyses(tickets: list[dict], startDate: str, endDate: str, extra_rules: list[str] | None = None, chart_ids: list[str] | None = None) -> list[dict]:
    period_label = format_period_label(startDate, endDate)
    global_context = build_global_ticket_context(tickets)

    results = []
    for chart_id in (chart_ids or CHART_IDS):
        chart_context = build_chart_context(chart_id, global_context)
        results.append(analyze_chart_with_ai(chart_id, period_label, chart_context, extra_rules))

    return results


def generate_overall_trends_summary(tickets: list[dict], startDate: str, endDate: str, extra_rules: list[str] | None = None) -> dict:
    period_label = format_period_label(startDate, endDate)
    global_context = build_global_ticket_context(tickets)
    overall_context = build_overall_trends_context(global_context)
    priority_context = build_action_priority_context(global_context)

    return analyze_overall_trends_with_ai(period_label, overall_context, priority_context, extra_rules)