import psycopg2
import pandas as pd
import os
import logging
import time

DATABASE_URL = os.getenv("DATABASE_URL")

# =======================================================
# HÀM CHỈ BÁO
# =======================================================

def calculate_bollinger_bands(series, window, num_std=2):
    """Tính Bollinger Bands (MA ± std * num_std)."""
    MA = series.rolling(window=window).mean()
    std_dev = series.rolling(window=window).std(ddof=0)
    upper_band = MA + (num_std * std_dev)
    lower_band = MA - (num_std * std_dev)
    return upper_band, lower_band


def calculate_rsi(series, window):
    """Tính RSI chuẩn (EMA)."""
    delta = series.diff()

    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)

    avg_gain = gain.ewm(com=window - 1, min_periods=window).mean()
    avg_loss = loss.ewm(com=window - 1, min_periods=window).mean()

    RS = avg_gain / avg_loss
    RSI = 100 - (100 / (1 + RS))
    return RSI


# =======================================================
# ÁP DỤNG CHỈ BÁO VỚI WINDOW RIÊNG THEO DAILY/WEEKLY/MONTHLY
# =======================================================

def apply_indicators(df, bb_window, rsi_window):
    """Tính BB + RSI theo từng coin_id với window tuỳ theo type."""

    df["upper_band"], df["lower_band"] = calculate_bollinger_bands(
        df["current_price"],
        window=bb_window,
        num_std=2
    )

    df["price_rsi"] = calculate_rsi(
        df["current_price"],
        window=rsi_window
    )

    return df


# =======================================================
# HÀM CHÍNH RESAMPLE
# =======================================================

def resample_data():

    if not DATABASE_URL:
        logging.error("DATABASE_URL environment variable not set")
        return

    try:
        # --------------------------------------------------
        # 1. Lấy dữ liệu gốc
        # --------------------------------------------------
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

        # --------------------------------------------------
        # 2. DAILY
        # --------------------------------------------------
        daily = df.copy().reset_index()
        daily["price_max"] = daily["current_price"]
        daily["price_min"] = daily["current_price"]
        daily["type"] = "day"

        daily = daily.groupby("coin_id", group_keys=False).apply(
            lambda x: apply_indicators(x, bb_window=20, rsi_window=14)
        )

        # --------------------------------------------------
        # 3. MONTHLY
        # --------------------------------------------------

        monthly_temp = df.reset_index()

        monthly = monthly_temp.groupby("coin_id").resample("M", on="timestamp").agg({
            "current_price": ["mean", "max", "min"],
            "market_cap": "mean",
            "total_volume": "mean",
            "timestamp": "last" 
        })

        # Đổi tên cột như trước
        monthly.columns = ["current_price", "price_max", "price_min", "market_cap", "total_volume", "resample_timestamp"]

        # Đặt cột resample_timestamp thành index mới (timestamp mong muốn)
        monthly = monthly.reset_index(level="coin_id").set_index("resample_timestamp")
        # Đổi tên index mới thành 'timestamp'
        monthly.index.name = "timestamp"

        monthly = monthly.reset_index()
        monthly["type"] = "month"

        monthly = monthly.groupby("coin_id", group_keys=False).apply(
            lambda x: apply_indicators(x, bb_window=5, rsi_window=3)
        )
        # weekly = df.groupby("coin_id").resample("W").agg({
        #     "current_price": ["mean", "max", "min"],
        #     "market_cap": "mean",
        #     "total_volume": "mean"
        # })
        # weekly.columns = ["current_price", "price_max", "price_min", "market_cap", "total_volume"]
        # weekly = weekly.reset_index()
        # weekly["type"] = "week"

        # weekly = weekly.groupby("coin_id", group_keys=False).apply(
        #     lambda x: apply_indicators(x, bb_window=10, rsi_window=7)
        # )

       
        # --------------------------------------------------
        # 4. WEEKLY
        # --------------------------------------------------
        # Reset index tạm thời để có thể truy cập cột timestamp
        weekly_temp = df.reset_index()

        weekly = weekly_temp.groupby("coin_id").resample("W", on="timestamp").agg({
            "current_price": ["mean", "max", "min"],
            "market_cap": "mean",
            "total_volume": "mean",
            "timestamp": "last" 
        })

        # Đổi tên cột như trước
        weekly.columns = ["current_price", "price_max", "price_min", "market_cap", "total_volume", "resample_timestamp"]

        # Đặt cột resample_timestamp thành index mới (timestamp mong muốn)
        weekly = weekly.reset_index(level="coin_id").set_index("resample_timestamp")
        # Đổi tên index mới thành 'timestamp'
        weekly.index.name = "timestamp"

        weekly = weekly.reset_index()
        weekly["type"] = "week"

        weekly = weekly.groupby("coin_id", group_keys=False).apply(
            lambda x: apply_indicators(x, bb_window=10, rsi_window=7)
        )

       
        # --------------------------------------------------
        # 5. Gộp chung
        # --------------------------------------------------
        final_df = pd.concat([daily, weekly, monthly], ignore_index=True)

        # Convert NaN → None để DB chấp nhận NULL
        final_df = final_df.where(pd.notnull(final_df), None)

        # --------------------------------------------------
        # 6. Insert / Update DB
        # --------------------------------------------------
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        insert_sql = """
            INSERT INTO price_resampling
            (coin_id, timestamp, current_price, price_max, price_min, market_cap, total_volume, type,
            upper_band, lower_band, price_rsi)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (coin_id, timestamp, type)
            DO UPDATE SET
                current_price = EXCLUDED.current_price,
                price_max = EXCLUDED.price_max,
                price_min = EXCLUDED.price_min,
                market_cap = EXCLUDED.market_cap,
                total_volume = EXCLUDED.total_volume,
                upper_band = EXCLUDED.upper_band,
                lower_band = EXCLUDED.lower_band,
                price_rsi = EXCLUDED.price_rsi;
        """

        for _, row in final_df.iterrows():
            cur.execute(insert_sql, (
                row["coin_id"],
                row["timestamp"],
                row["current_price"],
                row["price_max"],
                row["price_min"],
                row["market_cap"],
                row["total_volume"],
                row["type"],
                row["upper_band"],
                row["lower_band"],
                row["price_rsi"]
            ))

        conn.commit()
        cur.close()
        conn.close()

        logging.info("Resampling + indicators completed and saved.")

    except Exception as e:
        logging.error(f"Error during processing: {e}")


# -------------------------------------------------------
# CHẠY TRONG DOCKER
# -------------------------------------------------------
if __name__ == "__main__":
    time.sleep(5)
    logging.basicConfig(level=logging.INFO)
    logging.info("Running resampling job...")
    resample_data()
    logging.info("Job finished")
