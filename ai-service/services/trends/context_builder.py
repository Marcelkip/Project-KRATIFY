from collections import Counter, defaultdict
from .normalizers import normalize_tickets

# Tickets get normalized so there is only data that is actually usefull for now
#
# With normalized tickets we want to keep count on various data points. Here we make datapoints for peak detection etc.
def build_global_ticket_context(tickets: list[dict]) -> dict:
    normalized = normalize_tickets(tickets)

    per_day = Counter()
    per_category = Counter()
    per_entry_type = Counter()
    per_location = Counter()
    per_system = Counter()
    per_issue_type = Counter()
    per_description = Counter()

    system_issue_combo = Counter()
    system_description_combo = Counter()
    issue_description_combo = Counter()

    location_system_combo = Counter()
    location_issue_combo = Counter()
    location_system_issue_combo = Counter()

    department_system_combo = Counter()
    department_issue_combo = Counter()
    role_issue_combo = Counter()

    day_to_tickets = defaultdict(list)
    category_to_tickets = defaultdict(list)
    entry_type_to_tickets = defaultdict(list)
    location_to_tickets = defaultdict(list)
    system_to_tickets = defaultdict(list)
    issue_type_to_tickets = defaultdict(list)

    for ticket in normalized:
        day_label = ticket["creationDateLabel"]
        category = ticket["category"]
        entry_type = ticket["entryType"]
        location = ticket["location"]
        department = ticket["department"]
        role = ticket["role"]
        description = ticket["briefDescriptionAI"]

        per_day[day_label] += 1
        day_to_tickets[day_label].append(ticket)

        per_category[category] += 1
        category_to_tickets[category].append(ticket)

        per_entry_type[entry_type] += 1
        entry_type_to_tickets[entry_type].append(ticket)

        per_location[location] += 1
        location_to_tickets[location].append(ticket)

        per_description[description] += 1

        for system in ticket["systems"]:
            per_system[system] += 1
            system_to_tickets[system].append(ticket)

            system_description_combo[(system, description)] += 1
            location_system_combo[(location, system)] += 1
            department_system_combo[(department, system)] += 1

        for issue_type in ticket["issue_types"]:
            per_issue_type[issue_type] += 1
            issue_type_to_tickets[issue_type].append(ticket)

            issue_description_combo[(issue_type, description)] += 1
            location_issue_combo[(location, issue_type)] += 1
            department_issue_combo[(department, issue_type)] += 1
            role_issue_combo[(role, issue_type)] += 1

        for system in ticket["systems"]:
            for issue_type in ticket["issue_types"]:
                system_issue_combo[(system, issue_type)] += 1
                location_system_issue_combo[(location, system, issue_type)] += 1

    return {
        "normalized_tickets": normalized,
        "per_day": per_day,
        "per_category": per_category,
        "per_entry_type": per_entry_type,
        "per_location": per_location,
        "per_system": per_system,
        "per_issue_type": per_issue_type,
        "per_description": per_description,
        "system_issue_combo": system_issue_combo,
        "system_description_combo": system_description_combo,
        "issue_description_combo": issue_description_combo,
        "location_system_combo": location_system_combo,
        "location_issue_combo": location_issue_combo,
        "location_system_issue_combo": location_system_issue_combo,
        "department_system_combo": department_system_combo,
        "department_issue_combo": department_issue_combo,
        "role_issue_combo": role_issue_combo,
        "day_to_tickets": day_to_tickets,
        "category_to_tickets": category_to_tickets,
        "entry_type_to_tickets": entry_type_to_tickets,
        "location_to_tickets": location_to_tickets,
        "system_to_tickets": system_to_tickets,
        "issue_type_to_tickets": issue_type_to_tickets,
    }