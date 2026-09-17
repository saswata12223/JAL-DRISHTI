import sqlite3, os

db = os.path.join('data', 'jal_drishti_sos.db')
conn = sqlite3.connect(db)

tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print('Tables:', tables)

for t in tables:
    name = t[0]
    cols = conn.execute(f"PRAGMA table_info({name})").fetchall()
    print(f"\nColumns in {name}:", [c[1] for c in cols])
    rows = conn.execute(f"SELECT id, source, name FROM {name} LIMIT 10").fetchall()
    print(f"Rows:", rows)

conn.close()
