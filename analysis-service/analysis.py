# analysis.py
import psycopg2
import pandas as pd
import os
import logging

DATABASE_URL = os.getenv("DATABASE_URL")

def resample_data():
    """
    Hàm xử lý dữ liệu tuần và ghi vào bảng price_history_weekly.
    Dùng được trong Docker container hoặc chạy thủ công.
    """

    if not DATABASE_URL:
        logging.error("DATABASE_URL environment variable not set")
        return

    coin_ids = ['bitcoin', 'dogecoin', 'ethereum', 'solana', 'tether']
    coin_list_str = ', '.join(f"'{c}'" for c in coin_ids)

    try:
        # 1. Lấy dữ liệu raw
        conn = psycopg2.connect(DATABASE_URL)
        query = f"""
            SELECT 
                c.id AS coin_id,
                ph.timestamp,
                ph.current_price,
                ph.market_cap,
                ph.total_volume
            FROM price_history ph
            JOIN coins c ON ph.coin_id = c.id
            WHERE c.id IN ({coin_list_str})
            ORDER BY ph.timestamp;
        """

        df = pd.read_sql_query(query, conn)
        conn.close()

        if df.empty:
            logging.info("No data found in price_history")
            return

        # 2. Chuẩn hóa timestamp
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df = df.set_index("timestamp")

        # 3. Resample theo tuần
        res_avg = df.groupby("coin_id")["current_price"].resample("W").mean().reset_index().rename(
            columns={"current_price": "weekly_avg_price"}
        )
        res_max = df.groupby("coin_id")["current_price"].resample("W").max().reset_index().rename(
            columns={"current_price": "weekly_max_price"}
        )
        res_min = df.groupby("coin_id")["current_price"].resample("W").min().reset_index().rename(
            columns={"current_price": "weekly_min_price"}
        )
        res_mkt = df.groupby("coin_id")["market_cap"].resample("W").mean().reset_index().rename(
            columns={"market_cap": "weekly_avg_mkt_cap"}
        )
        res_vol = df.groupby("coin_id")["total_volume"].resample("W").mean().reset_index().rename(
            columns={"total_volume": "weekly_total_volume"}
        )

        # 4. Merge
        merged = (
            res_avg
            .merge(res_max, on=["coin_id", "timestamp"])
            .merge(res_min, on=["coin_id", "timestamp"])
            .merge(res_mkt, on=["coin_id", "timestamp"])
            .merge(res_vol, on=["coin_id", "timestamp"])
        )

        merged.rename(columns={"timestamp": "week_start_date"}, inplace=True)
        merged["week_start_date"] = merged["week_start_date"].dt.date

        # 5. Upsert vào bảng weekly
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        insert_sql = """
            INSERT INTO price_history_weekly 
            (coin_id, week_start_date, weekly_avg_price, weekly_max_price, weekly_min_price,
             weekly_total_volume, weekly_avg_mkt_cap)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (coin_id, week_start_date)
            DO UPDATE SET
                weekly_avg_price = EXCLUDED.weekly_avg_price,
                weekly_max_price = EXCLUDED.weekly_max_price,
                weekly_min_price = EXCLUDED.weekly_min_price,
                weekly_total_volume = EXCLUDED.weekly_total_volume,
                weekly_avg_mkt_cap = EXCLUDED.weekly_avg_mkt_cap;
        """

        for _, row in merged.iterrows():
            cur.execute(insert_sql, (
                row["coin_id"],
                row["week_start_date"],
                float(row["weekly_avg_price"]),
                float(row["weekly_max_price"]),
                float(row["weekly_min_price"]),
                int(row["weekly_total_volume"] or 0),
                int(row["weekly_avg_mkt_cap"] or 0)
            ))

        conn.commit()
        cur.close()
        conn.close()

        logging.info("Weekly resample completed successfully")

    except Exception as e:
        logging.error(f"Error processing weekly data: {e}")


# 🔥 Nếu chạy file này trực tiếp trong Docker:
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logging.info("Running weekly resample job...")
    resample_data()
    logging.info("Job finished")
