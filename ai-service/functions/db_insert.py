import json
import os
import psycopg

DB_PATH = os.getenv("DB_PATH")

def insertTicket(reportId: int, ticket: dict):
    conn = psycopg.connect(os.getenv('DATABASE_URL'))
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO "Ticket"
        ("topdeskId", "category", "subCategory", "systems", "issue_types", "briefDescription", "callerLocation", "callerDepartment", "callerRole", "operatorName", "operatorGroup", "closed", "closedDate", "completed", "completedDate", "responded", "respondedDate", "creationDate", "callDate", "status", "entryType", "impact", "urgency", "priority", "latestUpdate", "latestUpdateBy", "briefDescriptionAI", "reportId")
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        ticket["topdeskId"],
        ticket["category"],
        ticket["subcategory"],
        # json.dumps(ticket["keywords"]),
        ticket["systems"],
        ticket["issue_types"],
        ticket["briefDescription"],
        ticket["callerLocation"],
        ticket["callerDepartment"],
        ticket["callerRole"],
        ticket["operatorName"],
        ticket["operatorGroup"],
        ticket["closed"],
        ticket["closedDate"],
        ticket["completed"],
        ticket["completedDate"],
        ticket["responded"],
        ticket["respondedDate"],
        ticket["creationDate"],
        ticket["callDate"],
        ticket["status"],
        ticket["entryType"],
        ticket["impact"],
        ticket["urgency"],
        ticket["priority"],
        ticket["latestUpdate"],
        ticket["latestUpdateBy"],
        ticket["briefDescriptionAI"],
        ticket["reportId"]
    ))

    conn.commit()
    conn.close()
