import json
from .config import DEFAULT_EXTRA_RULES, CHART_SPECIFIC_RULES
from .helpers import dedupe_keep_order


def build_chart_description_prompt(chart_id: str, period_label: str, chart_context: dict, extra_rules: list[str] | None = None) -> str:
    merged_rules = []
    merged_rules.extend(DEFAULT_EXTRA_RULES)
    merged_rules.extend(CHART_SPECIFIC_RULES.get(chart_id, []))
    if extra_rules:
        merged_rules.extend(extra_rules)

    rules_text = "\n".join(f"- {rule}" for rule in dedupe_keep_order(merged_rules))
    chart_context_json = json.dumps(chart_context, ensure_ascii=False)

    return f"""
Je bent een Nederlandse servicedesk-analist.

Je krijgt geaggregeerde ticketdata en afgeleide context voor één grafiek.
Schrijf op basis daarvan een korte, inhoudelijke Nederlandse analyse.

Doel:
- Benoem opvallende trends, pieken, dalingen en verhoudingen.
- Gebruik de inhoudelijke ticketcontext om uit te leggen waar trends waarschijnlijk over gaan.
- Noem wanneer een stijging mogelijk verklaarbaar of verwacht is op basis van extra regels.
- Geef concrete verbetervoorstellen om ticketvolume te verlagen waar dat logisch is.

Belangrijke regels:
{rules_text}

Outputregels:
- Geef alleen geldig JSON terug.
- Geen markdown.
- Gebruik exact dit formaat:
{{
  "chart_id": "{chart_id}",
  "description_nl": "korte analyse in het Nederlands",
  "trend_type": "stable|increase|decrease|fluctuating|mixed",
  "severity": "low|medium|high",
  "possible_actions": ["actie 1", "actie 2", "actie 3"]
}}

Periode:
{period_label}

Chart context:
{chart_context_json}
""".strip()


def build_overall_trends_prompt(period_label: str, overall_context: dict, priority_context: dict, extra_rules: list[str] | None = None) -> str:
    rules = [
        "Beschrijf alleen trends en opvallende waardes die logisch uit de data volgen.",
        "Noem concrete onderwerpen, systemen, issue types en patronen als die dominant zijn.",
        "Besteed extra aandacht aan combinaties van locatie, systeem en issue type.",
        "Als een locatie duidelijk gekoppeld is aan een specifiek probleem, benoem dat expliciet.",
        "Gebruik de geprioriteerde patronen om acties te rangschikken op verwachte impact.",
        "Geef 2 tot 5 concrete aanbevelingen om ticketvolume te verlagen.",
        "Vermijd speculatie zonder duidelijke aanwijzing.",
        "Schrijf zakelijk en duidelijk in het Nederlands."
    ]

    if extra_rules:
        rules.extend(extra_rules)

    rules_text = "\n".join(f"- {rule}" for rule in dedupe_keep_order(rules))

    return f"""
Je bent een Nederlandse servicedesk-analist.

Je schrijft de algemene sectie 'Trends & Opvallende waardes' voor een helpdeskrapport.
Deze sectie is niet aan één grafiek gekoppeld, maar vat de belangrijkste trends en opvallende patronen over de hele rapportage samen.

Belangrijke regels:
{rules_text}

Outputregels:
- Geef alleen geldig JSON terug.
- Geen markdown.
- Gebruik exact dit formaat:
{{
  "summary_nl": "samenvattende tekst in het Nederlands",
  "highlights": ["punt 1", "punt 2", "punt 3"],
  "risks": ["risico 1", "risico 2"],
  "recommended_actions": [
    {{
      "priority": 1,
      "title": "korte maatregel",
      "why": "waarom deze maatregel prioriteit heeft",
      "expected_impact": "high|medium|low"
    }}
  ]
}}

Periode:
{period_label}

Rapportcontext:
{json.dumps(overall_context, ensure_ascii=False)}

Geprioriteerde patronen:
{json.dumps(priority_context, ensure_ascii=False)}
""".strip()