import requests
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("TOPDESK_URL")
AUTH_CODE = os.getenv("TOPDESK_AUTH_BASE64")

FETCHING_FIELDS = {
    "modifier.name",
    "modificationDate",
    "callDate",
    "creationDate",
    "closed",
    "closedDate",
    "completed",
    "completedDate",
    "responded",
    "responseDate",
    "operatorGroup.name",
    "operator.name",
    "priority.name",
    "urgency.name",
    "impact.name",
    "entryType.name",
    "category.name",
    "subcategory.name",
    "briefDescription",
    "id",
    "status",
    "request",
    "caller.branch.name",
    "caller.department.name",
    "caller.budgetHolder.name"
}

PAGE_SIZE = 10000  # TOPdesk max per request


def fetchTickets(start_date, end_date):
    if not start_date or not end_date:
        return 'error'

    tickets = []
    start = 0

    try:
        while True:
            response = requests.get(
                f"{BASE_URL}/tas/api/incidents",
                params={
                    "fields": ",".join(FETCHING_FIELDS),
                    "query": f"creationDate>='{start_date}';creationDate<='{end_date}'",
                    "pageStart": start,
                    "pageSize": PAGE_SIZE,
                },
                headers={
                    "Authorization": f"Basic {AUTH_CODE}",
                    "Accept": "application/json",
                },
                timeout=60,
            )

            if response.status_code == 204:  # no (more) tickets
                break
            if response.status_code not in (200, 206):
                print(f"TOPdesk error {response.status_code}: {response.text[:300]}")
                return 'error'

            page = response.json()
            tickets.extend(page)

            if response.status_code == 200 or not page:  # 200 = last page
                break
            start += len(page)  # 206 = more pages

        return tickets

    except requests.exceptions.RequestException as e:
        print(f"TOPdesk request failed: {e}")
        return 'error'
