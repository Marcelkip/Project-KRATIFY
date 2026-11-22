import os
import psycopg
from psycopg.types.json import Json


def upsert_report_trends_summary(reportId: int, summary: dict):
    with psycopg.connect(os.getenv("DATABASE_URL")) as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO "ReportTrendsSummary"
                ("summary", "highlights", "risks", "recommendedActions", "reportId")
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT ("reportId")
                DO UPDATE SET
                    "summary" = EXCLUDED."summary",
                    "highlights" = EXCLUDED."highlights",
                    "risks" = EXCLUDED."risks",
                    "recommendedActions" = EXCLUDED."recommendedActions"
            """, (
                summary["summary_nl"],
                Json(summary.get("highlights", [])),
                Json(summary.get("risks", [])),
                Json(summary.get("recommended_actions", [])),
                reportId
            ))


def upsert_chart_description(reportId: int, chart: dict):
    with psycopg.connect(os.getenv("DATABASE_URL")) as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO "ChartDescriptions"
                ("chartType", "description", "trendType", "severity", "possibleActions", "reportId")
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT ("reportId", "chartType")
                DO UPDATE SET
                    "description" = EXCLUDED."description",
                    "trendType" = EXCLUDED."trendType",
                    "severity" = EXCLUDED."severity",
                    "possibleActions" = EXCLUDED."possibleActions"
            """, (
                chart["chart_id"],
                chart["description_nl"],
                chart.get("trend_type"),
                chart.get("severity"),
                Json(chart.get("possible_actions", [])),
                reportId
            ))