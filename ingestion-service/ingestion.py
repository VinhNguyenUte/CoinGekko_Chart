import logging 
import os 
import time 
import requests 
import schedule 
import psycopg2 
from requests.adapters import HTTPAdapter 
from urllib3.util.retry import Retry 
from urllib.parse import urlparse 
from datetime import datetime

# ------------------------
# Config & Logging
# ------------------------
COINGECKO_API_KEY = "CG-wZsMMjrCVZLoEaYqRUxLjDrS"

headers = {
    "User-Agent": "Mozilla/5.0 (RateLimitTester)", 
    "Accept": "application/json",
    "x-cg-demo-api-key": COINGECKO_API_KEY 
}

#
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()],
)

TOP_5_URL = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,dogecoin,tether"
HISTORY_URL = "https://api.coingecko.com/api/v3/coins/{coin}/market_chart?vs_currency=usd&days=180"
CALL_INTERVAL_MINUTES = int(os.getenv("CALL_INTERVAL_MINUTES", "5"))

# Retry session
session = requests.Session()
retries = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
session.mount("https://", HTTPAdapter(max_retries=retries))

# ------------------------ #
# CONNECT DB               #
# ------------------------ #
def get_db_connection():
    try:
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            logging.error("DATABASE_URL missing")
            return None

        parsed = urlparse(db_url)
        return psycopg2.connect(
            dbname=parsed.path.lstrip("/"),
            user=parsed.username,
            password=parsed.password,
            host=parsed.hostname,
            port=parsed.port,
        )
    except Exception as e:
        logging.error("DB connect failed: %s", e)
        return None


# ------------------------ #
# CREATE TABLE             #
# ------------------------ #
def create_tables():
    conn = get_db_connection()
    if not conn:
        return

    try:
        cur = conn.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS coins (
                id TEXT PRIMARY KEY,
                symbol TEXT,
                name TEXT,
                market_cap_rank INT,
                last_updated TIMESTAMP,
                high_24h DOUBLE PRECISION,
                low_24h DOUBLE PRECISION,
                price_change_24h DOUBLE PRECISION,
                price_change_percentage_24h DOUBLE PRECISION
            );
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS price_history (
                id SERIAL PRIMARY KEY,
                coin_id TEXT REFERENCES coins(id),
                timestamp TIMESTAMP NULL,
                current_price DOUBLE PRECISION NULL,
                market_cap BIGINT NULL,
                total_volume BIGINT NULL,
                UNIQUE (coin_id, timestamp)
            );
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS price_predictions (
                id SERIAL PRIMARY KEY,
                coin_id TEXT REFERENCES coins(id),
                coin_name TEXT NULL,
                predicted_price DOUBLE PRECISION NULL,
                actual_price DOUBLE PRECISION NULL
            );
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS coin_clustered (
                id SERIAL PRIMARY KEY,
                coin_id TEXT REFERENCES coins(id),
                timestamp TIMESTAMP,
                current_price DOUBLE PRECISION,
                market_cap BIGINT,
                total_volume BIGINT,
                percentage_change DOUBLE PRECISION,
                volatility DOUBLE PRECISION,
                momentum DOUBLE PRECISION,
                cluster_label INT,
                type TEXT
            );
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS price_resampling (
                id SERIAL PRIMARY KEY,
                coin_id TEXT REFERENCES coins(id),
                timestamp TIMESTAMP NULL,
                current_price DOUBLE PRECISION NULL,
                price_max DOUBLE PRECISION NULL,
                price_min DOUBLE PRECISION NULL,
                upper_band DOUBLE PRECISION NULL,
                lower_band DOUBLE PRECISION NULL,
                price_rsi DOUBLE PRECISION NULL,
                market_cap BIGINT NULL,
                total_volume BIGINT NULL,
                type TEXT DEFAULT 'day'
            );
        """)

        cur.execute("""
            ALTER TABLE price_resampling
            ADD CONSTRAINT unique_coin UNIQUE (coin_id, timestamp, type);
        """)

        cur.execute("""
            DELETE FROM price_history
            WHERE timestamp < NOW() - INTERVAL '180 days'
        """)


        conn.commit()
        cur.close()
        logging.info("Tables ensured.")

    except Exception as e:
        logging.error("Create table error: %s", e)
    finally:
        conn.close()


# ------------------------ #
# FETCH TOP 5 COIN         #
# ------------------------ #
def fetch_top5_coins():
    try:
        resp = session.get(TOP_5_URL, timeout=15, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        logging.info("Fetched %d coins", len(data))
        return data
    except Exception as e:
        logging.error("Fetch coin list failed: %s", e)
        return None


# ------------------------ #
# FETCH 30-DAY HISTORY     #
# ------------------------ #
def fetch_history(coin_id):
    try:
        url = HISTORY_URL.format(coin=coin_id)
        r = session.get(url, timeout=10, headers=headers)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        logging.error("History fetch failed for %s: %s", coin_id, e)
        return None


# ------------------------ #
# SAVE COIN METADATA       #
# ------------------------ #
def save_coin_info(coin):
    conn = get_db_connection()
    if not conn:
        return

    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO coins (
                id, symbol, name, market_cap_rank, last_updated,
                high_24h, low_24h, price_change_24h, price_change_percentage_24h
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                market_cap_rank = EXCLUDED.market_cap_rank,
                last_updated = EXCLUDED.last_updated,
                high_24h = EXCLUDED.high_24h,
                low_24h = EXCLUDED.low_24h,
                price_change_24h = EXCLUDED.price_change_24h,
                price_change_percentage_24h = EXCLUDED.price_change_percentage_24h;
        """, (
            coin["id"],
            coin["symbol"],
            coin["name"],
            coin.get("market_cap_rank"),
            coin.get("last_updated"),
            coin.get("high_24h"),
            coin.get("low_24h"),
            coin.get("price_change_24h"),
            coin.get("price_change_percentage_24h"),
        ))
        conn.commit()
        cur.close()
    except Exception as e:
        logging.error("Save coin info error: %s", e)
    finally:
        conn.close()


# ------------------------ #
# SAVE 30-DAY HISTORY      #
# ------------------------ #
def save_history_data(coin_id, history):
    if "prices" not in history:
        return

    conn = get_db_connection()
    if not conn:
        return

    try:
        cur = conn.cursor()
        for i in range(len(history["prices"])):
            try:
                ts = datetime.fromtimestamp(history["prices"][i][0] / 1000)
                price = history["prices"][i][1]
                market_cap = history["market_caps"][i][1]
                total_vol = history["total_volumes"][i][1]

                cur.execute("""
                    INSERT INTO price_history (
                        coin_id, timestamp, current_price, market_cap, total_volume
                    ) VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (coin_id, timestamp) DO NOTHING;
                """, (coin_id, ts, price, market_cap, total_vol))
            except Exception:
                continue  # bỏ qua entry lỗi

        conn.commit()
        cur.close()
    except Exception as e:
        logging.error("Save 30-day history error: %s", e)
    finally:
        conn.close()


# ------------------------ #
# MAIN JOB                 #
# ------------------------ #
def job():
    logging.info("Job started")
    top5 = fetch_top5_coins()
    if not top5:
        return

    for coin in top5:
        save_coin_info(coin)
        history = fetch_history(coin["id"])
        if history:
            save_history_data(coin["id"], history)

    logging.info("Job done")


# ------------------------ #
# MAIN LOOP                #
# ------------------------ #
def main():
    create_tables()
    print("DATABASE_URL =", os.getenv("DATABASE_URL"))

    schedule.every(CALL_INTERVAL_MINUTES).minutes.do(job)
    job()  # run immediately

    while True:
        schedule.run_pending()
        time.sleep(1)


if __name__ == "__main__":
    main()