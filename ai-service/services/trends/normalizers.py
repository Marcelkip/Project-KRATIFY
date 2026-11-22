from .helpers import safe_str, safe_list, parse_date

# Clean up ticketObject.
def normalize_ticket(ticket: dict) -> dict:
    systems = safe_list(ticket.get("systems"))
    issue_types = safe_list(ticket.get("issue_types"))

    brief_description = (
        safe_str(ticket.get("briefDescriptionAI"))
        or safe_str(ticket.get("briefDescription"))
        or "Onbekend probleem"
    )

    creation_date = (
        parse_date(ticket.get("creationDate"))
        or parse_date(ticket.get("callDate"))
        or parse_date(ticket.get("closedDate"))
    )

    return {
        "topdeskId": safe_str(ticket.get("topdeskId")),
        "category": safe_str(ticket.get("category")) or "unknown",
        "subcategory": safe_str(ticket.get("subcategory")) or "unknown",
        "entryType": safe_str(ticket.get("entryType")) or "unknown",
        "location": safe_str(ticket.get("callerLocation")) or "unknown",
        "department": safe_str(ticket.get("callerDepartment")) or "unknown",
        "role": safe_str(ticket.get("callerRole")) or "unknown",
        "systems": systems or ["unknown"],
        "issue_types": issue_types or ["unknown"],
        "briefDescriptionAI": brief_description,
        "creationDate": creation_date,
        "creationDateLabel": creation_date.strftime("%Y-%m-%d") if creation_date else "unknown",
    }

# Ticket array loop
def normalize_tickets(tickets: list[dict]) -> list[dict]:
    return [normalize_ticket(ticket) for ticket in tickets]