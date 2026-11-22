from functions.fetch_tickets import fetchTickets
from functions.db_insert import insertTicket
from processes.remove_sensitive_data import removeSensitiveData
from processes.filter_ticket_types import filterTicketType
from functions.db_change_report_status import changeReportStatus
from functions.cleanup_array import cleanArray
from processes.process_cleaned import analyze_ticket

from services.trends import (
    generate_all_chart_analyses,
    generate_overall_trends_summary,
    upsert_chart_description,
    upsert_report_trends_summary,
)

from fastapi import FastAPI
import json

# TODO: Make prompts parallel compatible, this will greatly reduce process times.
# We were never really able to do this due me (Jop),
# finding out what parralel processing for AI actually means until a few days before the presentation.
# I did not want to refactor so much just for it all to break and not be able to present a functioning product.

app = FastAPI()
@app.get("/generate")
def sync_tickets(reportId: int, startDate: str, endDate: str):
    tickets = fetchTickets(startDate, endDate)
    processed = []

    if tickets == 'error':
        changeReportStatus(reportId, 'failed')
        return 'Failed'

    for ticket in tickets:
        desc = ticket["request"]

        cancelProcessing = filterTicketType(desc)
        if cancelProcessing:
            print("Filtered ticket:", ticket["id"])
            continue

        cleaned = removeSensitiveData(desc) or ''
        analysis = analyze_ticket(cleaned)
        systems = json.dumps(analysis["systems"])
        issueTypes = json.dumps(analysis["issue_types"])
        briefDescription = analysis["short_description"]

        # Clean up array
        cleanedArray = cleanArray(ticket)

        ticketObject = {
           "topdeskId" : cleanedArray["id"],
           "category" : cleanedArray["category"],
           "subcategory" : cleanedArray["subcategory"],
        #    "keywords" : json.dumps(keywords),
           "systems": systems,
           "issue_types": issueTypes,
           "briefDescription" : cleanedArray["briefDescription"],
           "callerLocation" : cleanedArray["caller"]["branch"],
           "callerDepartment" : cleanedArray["caller"]["department"],
           "callerRole" : cleanedArray["caller"]["budgetHolder"],
           "operatorName" : cleanedArray["operator"],
           "operatorGroup" : cleanedArray["operatorGroup"],
           "closed" : cleanedArray["closed"],
           "closedDate" : cleanedArray["closedDate"],
           "completed" : cleanedArray["completed"],
           "completedDate" : cleanedArray["completedDate"],
           "responded" : cleanedArray["responded"],
           "respondedDate" : cleanedArray["responseDate"],
           "creationDate" : cleanedArray["creationDate"],
           "callDate" : cleanedArray["callDate"],
           "status" : cleanedArray["status"],
           "entryType" : cleanedArray["entryType"],
           "impact" : cleanedArray["impact"],
           "urgency" : cleanedArray["urgency"],
           "priority" : cleanedArray["priority"],
           "latestUpdate" : cleanedArray["modificationDate"],
           "latestUpdateBy" : cleanedArray["modifier"],
           "briefDescriptionAI" : briefDescription or '',
           "reportId": reportId
        }

        # print(ticketObject)

        try:
            insertTicket(reportId, ticketObject)
            processed.append(ticketObject)
            print("Inserted ticket:", ticketObject["topdeskId"])
        except Exception as e:
            print(f"Error inserting ticket {ticketObject['topdeskId']}: {e}")
            continue

    chart_results = generate_all_chart_analyses(
        tickets=processed,
        startDate=startDate,
        endDate=endDate,
        extra_rules=[]
    )

    for chart in chart_results:
        upsert_chart_description(reportId, chart)

    overall_summary = generate_overall_trends_summary(
        tickets=processed,
        startDate=startDate,
        endDate=endDate,
        extra_rules=[]
    )

    upsert_report_trends_summary(reportId, overall_summary)

    changeReportStatus(reportId, 'review_required')
    return {"inserted": len(processed)}
