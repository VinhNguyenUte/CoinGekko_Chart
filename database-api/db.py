import os
import psycopg2
from urllib.parse import urlparse

def get_connection():
    print("Getting DB connection...")
    db_url = os.getenv("DATABASE_URL")
    print("DATABASE_URL:", db_url)
    if not db_url:
        raise Exception("DATABASE_URL not found")

    parsed = urlparse(db_url)

    conn = psycopg2.connect(
        dbname=parsed.path.lstrip("/"),
        user=parsed.username,
        password=parsed.password,
        host=parsed.hostname,
        port=parsed.port
    )
    print("DB connection established.")
    return conn
