# Test only the TOPdesk call. Run from the ai-service folder:  python test_topdesk.py
from functions.fetch_tickets import fetchTickets

tickets = fetchTickets("2026-10-01T00:00:00Z", "2026-10-07T23:59:59Z")

if tickets == 'error':
    print("FAILED - see error above")
else:
    print(f"OK - {len(tickets)} tickets")
    if tickets:
        t = tickets[0]
        print("First ticket id:", t.get("id"), "| category:", (t.get("category") or {}).get("name"))
