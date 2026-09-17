import sqlite3, os

db = os.path.join('data', 'jal_drishti_sos.db')
conn = sqlite3.connect(db)

deleted = conn.execute("DELETE FROM sos_messages")
conn.commit()
print(f"Deleted ALL {deleted.rowcount} records. DB is now empty.")
conn.close()
