import os
import psycopg

def changeReportStatus(reportId: int, status: str):
    conn = psycopg.connect(os.getenv('DATABASE_URL'))

    cursor = conn.cursor()

    cursor.execute(
        """
            UPDATE "Report"
            SET "status" = %s
            WHERE "id" = %s
        """,
        (status, reportId)
    )

    conn.commit()
    cursor.close()
    conn.close()