# analysis.py
import psycopg2
import pandas as pd
import os
import logging
import time

DATABASE_URL = os.getenv("DATABASE_URL")

def resample_data():

    if not DATABASE_URL:
        logging.error("DATABASE_URL environment variable not set")
        return

    try:
        # ---------------------------------------------
        # 1. Lấy dữ liệu từ price_history
        # ---------------------------------------------
        conn = psycopg2.connect(DATABASE_URL)
        query = """
            SELECT 
                coin_id,
                timestamp,
                current_price,
                market_cap,
                total_volume
            FROM price_history
            ORDER BY timestamp;
        """
        df = pd.read_sql_query(query, conn)
        conn.close()

        if df.empty:
            logging.info("No data found in price_history")
            return

        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df = df.set_index("timestamp")

        # ---------------------------------------------
        # 2. Tạo dữ liệu DAILY (type='day')
        # ---------------------------------------------
        daily = df.copy().reset_index()
        daily["price_max"] = daily["current_price"]
        daily["price_min"] = daily["current_price"]
        daily["type"] = "day"

        # ---------------------------------------------
        # 3. Tạo dữ liệu WEEKLY (type='week')
        # ---------------------------------------------
        weekly = df.groupby("coin_id").resample("W").agg({
            "current_price": ["mean", "max", "min"],
            "market_cap": "mean",
            "total_volume": "mean"
        })
        weekly.columns = ["current_price", "price_max", "price_min", "market_cap", "total_volume"]
        weekly = weekly.reset_index()
        weekly["type"] = "week"

        # ---------------------------------------------
        # 4. Tạo dữ liệu MONTHLY (type='month')
        # ---------------------------------------------
        monthly = df.groupby("coin_id").resample("M").agg({
            "current_price": ["mean", "max", "min"],
            "market_cap": "mean",
            "total_volume": "mean"
        })
        monthly.columns = ["current_price", "price_max", "price_min", "market_cap", "total_volume"]
        monthly = monthly.reset_index()
        monthly["type"] = "month"

        # ---------------------------------------------
        # 5. Gộp chung
        # ---------------------------------------------
        final_df = pd.concat([daily, weekly, monthly], ignore_index=True)

        # ---------------------------------------------
        # 6. Ghi vào bảng price_resampling
        # ---------------------------------------------
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        insert_sql = """
            INSERT INTO price_resampling
            (coin_id, timestamp, current_price, price_max, price_min, market_cap, total_volume, type)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (coin_id, timestamp, type)
            DO UPDATE SET
                current_price = EXCLUDED.current_price,
                price_max = EXCLUDED.price_max,
                price_min = EXCLUDED.price_min,
                market_cap = EXCLUDED.market_cap,
                total_volume = EXCLUDED.total_volume;
        """

        for _, row in final_df.iterrows():
            cur.execute(insert_sql, (
                row["coin_id"],
                row["timestamp"].to_pydatetime(),
                row["current_price"],
                row["price_max"],
                row["price_min"],
                row["market_cap"],
                row["total_volume"],
                row["type"]
            ))

        conn.commit()
        cur.close()
        conn.close()

        logging.info("Daily, Weekly & Monthly resampling saved to price_resampling")

    except Exception as e:
        logging.error(f"Error during processing: {e}")


# =============================================
# CHẠY TRONG DOCKER
# =============================================
if __name__ == "__main__":
    time.sleep(5)
    logging.basicConfig(level=logging.INFO)
    logging.info("Running resampling job...")
    resample_data()
    logging.info("Job finished")
