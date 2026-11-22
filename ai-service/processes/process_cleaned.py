import json
import re
from processes.prompter import call_llama


# ============================================================
# ALLOWED SYSTEMS
# ============================================================
# These represent the affected platform, product, or environment.
# A system answers the question:
# "Where is the issue happening?"
#
# Examples:
# - microsoft
# - eduarte
# - vpn
# - wifi
# ============================================================

ALLOWED_SYSTEMS = [
    "microsoft",
    "outlook_email",
    "teams",
    "onedrive_sharepoint",
    "eduarte",
    "afas",
    "vpn",
    "wifi",
    "network",
    "printer",
    "hardware_device",
    "remote_access",
    "guest",
    "pivot_point",
    "unknown_software",
    "unknown",
]

ALLOWED_SYSTEMS_SET = set(ALLOWED_SYSTEMS)


# ============================================================
# ALLOWED ISSUE TYPES
# ============================================================
# These represent the type of problem.
# An issue type answers the question:
# "What kind of problem is it?"
#
# Examples:
# - authentication
# - permissions
# - performance
# - software_issue
# ============================================================

ALLOWED_ISSUE_TYPES = [
    "authentication",
    "account_locked",
    "password_reset",
    "permissions",
    "mfa_2fa",
    "software_issue",
    "installation_update",
    "network_connectivity",
    "dns",
    "firewall_proxy",
    "performance",
    "guests", # Its not really a type, but otherwise the AI will classify as unknown. Making it harder for the trends/charts ai prompt to give actual usefull data.
    "unknown",
]

ALLOWED_ISSUE_TYPES_SET = set(ALLOWED_ISSUE_TYPES)


# ============================================================
# FALLBACK RESULT
# ============================================================
# This is returned if the model output is unusable.
# That way your pipeline never crashes and always returns
# a predictable structure.
# ============================================================

FALLBACK_RESULT = {
    "systems": ["unknown"],
    "issue_types": ["unknown"],
    "short_description": "Could not classify ticket consistently",
}


# ============================================================
# REMOVE DUPLICATES BUT KEEP ORDER
# ============================================================
# Example:
# ["vpn", "network", "vpn"] -> ["vpn", "network"]
#
# We keep original order because the first labels are often
# the most important/relevant ones.
# ============================================================

def _dedupe_keep_order(values: list[str]) -> list[str]:
    seen = set()
    result = []

    for value in values:
        if value not in seen:
            seen.add(value)
            result.append(value)

    return result


# ============================================================
# EXTRACT JSON OBJECT FROM RAW MODEL OUTPUT
# ============================================================
# LLMs sometimes return:
#
# Here is the JSON:
# {"systems": [...], "issue_types": [...], "short_description": "..."}
#
# We first try direct JSON parsing.
# If that fails, we search for the first {...} block.
# ============================================================

def _extract_json_object(raw: str) -> dict | None:
    if not raw:
        return None

    raw = raw.strip()

    # Try direct parsing first
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return data
    except Exception:
        pass

    # Fallback: extract JSON object from surrounding text
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        return None

    try:
        data = json.loads(match.group(0))
        if isinstance(data, dict):
            return data
    except Exception:
        return None

    return None


# ============================================================
# NORMALIZE A LIST OF LABELS
# ============================================================
# This helper:
# - ensures the result is a list
# - converts values to lowercase strings
# - filters out invalid values
# - removes duplicates
# - limits the number of labels
#
# It works for both systems and issue types.
# ============================================================

def _normalize_label_list(values, allowed_set: set[str], max_items: int = 5) -> list[str]:
    if not isinstance(values, list):
        return ["unknown"]

    cleaned = []

    for value in values:
        value = str(value).strip().lower()
        if value in allowed_set:
            cleaned.append(value)

    cleaned = _dedupe_keep_order(cleaned)

    if not cleaned:
        return ["unknown"]

    return cleaned[:max_items]


# ============================================================
# NORMALIZE SHORT DESCRIPTION
# ============================================================
# This keeps the short description stable and suitable for:
# - helpdesk agents
# - trend analysis
#
# Goals:
# - remove extra whitespace
# - remove surrounding quotes
# - trim trailing punctuation
# - limit length
# ============================================================

def _normalize_short_description(text: str) -> str:
    text = str(text or "").strip()

    # Replace multiple spaces/newlines/tabs with one space
    text = re.sub(r"\s+", " ", text)

    # Remove surrounding quotes
    text = text.strip("\"'")

    if not text:
        return FALLBACK_RESULT["short_description"]

    # Remove trailing punctuation for consistency
    text = text.rstrip(" .,!?:;")

    # Hard word limit to keep summaries compact and comparable
    words = text.split()
    if len(words) > 16:
        text = " ".join(words[:16])

    return text if text else FALLBACK_RESULT["short_description"]


# ============================================================
# RULE-BASED SYSTEM DETECTION
# ============================================================
# This adds stability.
#
# Even if the model forgets a system, this layer can restore it
# by checking obvious keywords in the ticket text.
# ============================================================

def _apply_system_rules(source_text: str, systems: list[str]) -> list[str]:
    text = source_text.lower()
    boosted = list(systems)

    def add(system: str):
        if system not in boosted and system in ALLOWED_SYSTEMS_SET:
            boosted.append(system)

    # Microsoft family
    if any(term in text for term in ["microsoft 365", "office 365", "o365", "m365", "microsoft"]):
        add("microsoft")

    if any(term in text for term in ["outlook", "mailbox", "shared mailbox", "email", "e-mail", "mail"]):
        add("outlook_email")

    if "teams" in text or "microsoft teams" in text:
        add("teams")

    if any(term in text for term in ["onedrive", "sharepoint", "file sync", "filesync"]):
        add("onedrive_sharepoint")

    # Eduarte
    if "eduarte" in text:
        add("eduarte")

    # Network / remote systems
    if "vpn" in text:
        add("vpn")

    if any(term in text for term in ["wifi", "wi-fi"]):
        add("wifi")

    if any(term in text for term in ["network", "internet", "lan", "connection", "verbinding"]):
        add("network")

    if any(term in text for term in ["remote desktop", "rdp", "extern bureaublad", "remote access"]):
        add("remote_access")

    # Devices
    if any(term in text for term in ["printer", "print queue", "printing", "afdrukken"]):
        add("printer")

    if any(term in text for term in ["laptop", "pc", "computer", "monitor", "dock", "mouse", "keyboard", "device", "digibord", "muis", "toetsenbord"]):
        add("hardware_device")

    # Remove unknown if we found real systems
    boosted = _dedupe_keep_order(boosted)
    if "unknown" in boosted and len(boosted) > 1:
        boosted.remove("unknown")

    return boosted[:5] if boosted else ["unknown"]


# ============================================================
# RULE-BASED ISSUE TYPE DETECTION
# ============================================================
# Same idea as system rules, but for the actual problem type.
# ============================================================

def _apply_issue_type_rules(source_text: str, issue_types: list[str]) -> list[str]:
    text = source_text.lower()
    boosted = list(issue_types)

    def add(issue_type: str):
        if issue_type not in boosted and issue_type in ALLOWED_ISSUE_TYPES_SET:
            boosted.append(issue_type)

    # Authentication family
    if any(term in text for term in [
        "login", "log in", "sign in", "signin",
        "cannot log in", "cannot sign in", "wrong password", "inloggen", "registreren", "uitloggen"
    ]):
        add("authentication")

    if any(term in text for term in ["password reset", "reset password", "wachtwoord reset", "nieuw wachtwoord"]):
        add("password_reset")

    if any(term in text for term in ["mfa", "2fa", "authenticator", "verification code", "verificatie code", "otp", "token"]):
        add("mfa_2fa")

    # Access / permissions
    if any(term in text for term in [
        "permission", "permissions", "access denied", "geen toegang",
        "not authorized", "rechten", "authorisatie", "toegang"
    ]):
        add("permissions")

    # General software / install / update
    if any(term in text for term in ["install", "installation", "update", "upgrade", "patch"]):
        add("installation_update")

    if any(term in text for term in ["error", "bug", "crash", "application closes", "werkt niet", "foutmelding"]):
        add("software_issue")

    # Network
    if any(term in text for term in ["dns", "name resolution", "cannot resolve", "resolve host"]):
        add("dns")

    if any(term in text for term in ["firewall", "proxy", "blocked by policy", "web filter"]):
        add("firewall_proxy")

    if any(term in text for term in [
        "cannot connect", "no connection", "offline", "connection failed",
        "verbindt niet", "geen verbinding"
    ]):
        add("network_connectivity")

    # Performance
    if any(term in text for term in ["slow", "slowness", "traag", "latency", "performance"]):
        add("performance")

    boosted = _dedupe_keep_order(boosted)
    if "unknown" in boosted and len(boosted) > 1:
        boosted.remove("unknown")

    return boosted[:5] if boosted else ["unknown"]


# ============================================================
# VALIDATE AND CORRECT MODEL OUTPUT
# ============================================================
# This is where we:
# 1. normalize systems
# 2. normalize issue types
# 3. normalize short description
# 4. apply rules to improve consistency
# ============================================================

def _validate_output(parsed: dict, source_text: str) -> dict:
    systems = _normalize_label_list(
        parsed.get("systems", []),
        ALLOWED_SYSTEMS_SET,
        max_items=5
    )

    issue_types = _normalize_label_list(
        parsed.get("issue_types", []),
        ALLOWED_ISSUE_TYPES_SET,
        max_items=5
    )

    short_description = _normalize_short_description(
        parsed.get("short_description", "")
    )

    # Add deterministic rule layer on top of model result
    systems = _apply_system_rules(source_text, systems)
    issue_types = _apply_issue_type_rules(source_text, issue_types)

    if not systems:
        systems = ["unknown"]

    if not issue_types:
        issue_types = ["unknown"]

    return {
        "systems": systems,
        "issue_types": issue_types,
        "short_description": short_description,
    }


# ============================================================
# BUILD THE PROMPT
# ============================================================
# This prompt tells the LLM exactly what structure to return
# and what labels are allowed.
#
# The stricter the prompt, the more stable the output.
# ============================================================

def build_ticket_prompt(text: str) -> str:
    allowed_systems_json = json.dumps(ALLOWED_SYSTEMS, ensure_ascii=False)
    allowed_issue_types_json = json.dumps(ALLOWED_ISSUE_TYPES, ensure_ascii=False)

    return f"""
You are a deterministic IT helpdesk ticket classifier.

Return ONLY valid JSON in exactly this format:
{{"systems":[],"issue_types":[],"short_description":""}}

Allowed systems only:
{allowed_systems_json}

Allowed issue_types only:
{allowed_issue_types_json}

Rules:
- Select 1 to 3 systems when possible.
- Select 1 to 3 issue_types when possible.
- Use only allowed values.
- Prefer specific labels over generic labels.
- Do not invent, rename, or explain labels.
- Use "unknown" only if classification is uncertain.

System guidance:
- Microsoft 365 / Office 365 / O365 -> "microsoft"
- Outlook / mailbox / email -> "outlook_email"
- Teams chat / meetings / calling -> "teams"
- OneDrive / SharePoint / file sync -> "onedrive_sharepoint"
- Eduarte -> "eduarte"
- VPN -> "vpn"
- Wi-Fi / wireless -> "wifi"
- General network / internet / connection -> "network"
- Printer / print queue -> "printer"
- Laptop / monitor / dock / device -> "hardware_device"
- Remote Desktop / RDP / remote workplace -> "remote_access"
- If the ticket is about software but it has no available tag. You use "unknown_software"

Issue type guidance:
- Sign-in problem -> "authentication"
- Locked account -> "account_locked"
- Password reset request -> "password_reset"
- Missing rights / access denied -> "permissions"
- MFA / authenticator / code / token -> "mfa_2fa"
- App crash / bug / error -> "software_issue"
- Install / update / patch issue -> "installation_update"
- Connectivity failure -> "network_connectivity"
- DNS resolution issue -> "dns"
- Proxy / firewall blocking -> "firewall_proxy"
- Slowness / latency -> "performance"

Short description rules:
- 8 to 16 words
- One normalized issue statement
- Neutral and factual
- No greetings, names, ticket IDs, or signatures
- Mention the affected system when clear
- Describe the actual problem
- Use stable wording for similar incidents

Examples:
{{"systems":["microsoft"],"issue_types":["authentication","mfa_2fa"],"short_description":"Cannot sign in to Microsoft 365 due to MFA prompt failure"}}
{{"systems":["eduarte"],"issue_types":["permissions"],"short_description":"Eduarte access denied because user lacks required permissions"}}
{{"systems":["vpn","remote_access"],"issue_types":["network_connectivity"],"short_description":"VPN connection fails when user connects from home network"}}

Ticket text:
{text}
""".strip()


# ============================================================
# MAIN FUNCTION
# ============================================================

def analyze_ticket(text: str) -> dict:
    # Prevent empty input from reaching the model
    if not text or not str(text).strip():
        return FALLBACK_RESULT.copy()

    # Build the prompt
    prompt = build_ticket_prompt(text)

    # Send prompt to your LLM wrapper
    raw_response = call_llama(prompt)

    # Safely parse JSON from the response
    parsed = _extract_json_object(str(raw_response))

    # If parsing fails, return fallback
    if not parsed:
        return FALLBACK_RESULT.copy()

    # Validate, normalize, and stabilize the result
    return _validate_output(parsed, text)