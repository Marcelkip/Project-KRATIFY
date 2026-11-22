# Standalone API that only returns TOPdesk tickets as JSON (no AI, no database).
# Run from the ai-service folder:  python -m uvicorn api.tickets:app --port 8000
from fastapi import FastAPI, HTTPException

from functions.fetch_tickets import fetchTickets
from functions.cleanup_array import cleanArray

app = FastAPI()


@app.get("/tickets")
def get_tickets(startDate: str, endDate: str):
    tickets = fetchTickets(startDate, endDate)
    if tickets == 'error':
        raise HTTPException(status_code=502, detail="Fetching tickets from TOPdesk failed")
    return cleanArray(tickets)  # {"category": {"name": "X"}} -> {"category": "X"}
