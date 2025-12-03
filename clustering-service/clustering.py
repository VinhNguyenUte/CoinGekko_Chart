import pandas as pd
import psycopg2
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import os
import time
import numpy as np
import warnings
warnings.filterwarnings("ignore", message="pandas only supports SQLAlchemy")

DATABASE_URL = os.getenv("DATABASE_URL")
timeout = 300  

# lấy dữ liệu bảng price_history từ DB 
def load_price_history():
    conn = psycopg2.connect(DATABASE_URL)
    query = """
        SELECT coin_id, timestamp, current_price, market_cap, total_volume
        FROM price_history
        ORDER BY timestamp ASC
    """

    # pandas đọc dữ liệu của query vào DataFrame
    df = pd.read_sql(query, conn)
    conn.close()

    # nếu df rỗng thì trả về df rỗng
    if df.empty:
        print("No data found in price_history.")
        return pd.DataFrame()

    # chuyển đổi kiểu timestamp thành kiểu date_time
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    num_cols = ["current_price", "market_cap", "total_volume"]
    # chuyển đổi các cột số thành kiểu số
    for c in num_cols:
        df[c] = pd.to_numeric(df[c], errors="coerce")

    # loại bỏ các hàng có giá trị NaN
    return df.dropna()


# lưu kết quả clustering vào bảng coin_clustered
def save_clustered(df):
    # nếu df rỗng thì không lưu
    if df.empty:
        print("No clustering result to save.")
        return

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    insert_query = """
        INSERT INTO coin_clustered(
            coin_id, timestamp, current_price, market_cap, total_volume,
            percentage_change, volatility, momentum, cluster_label, type
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s);
    """
    # lặp qua từng hàng của df và chèn vào bảng coin_clustered
    for _, row in df.iterrows():
        cur.execute(
            insert_query,
            (
                row["coin_id"],
                row["timestamp"],
                row["current_price"],
                row["market_cap"],
                row["total_volume"],
                row["percentage_change"],
                row["volatility"],
                row["momentum"],
                int(row["cluster_label"]),
                row["type"],
            ),
        )
    
    conn.commit()
    cur.close()
    conn.close()
    print(f"Saved {len(df)} clustered rows.")


# xây dựng các đặc trưng xu hướng từ dữ liệu giá
def build_trend_features(df, rolling_window=3, shift_period=3):
    df = df.copy()

    # ---------------------------------
    # 1. Percentage change (log return)
    # ---------------------------------
    df["log_price"] = np.log(df["current_price"])
    df["percentage_change"] = df["log_price"].diff()

    # ---------------------------------
    # 2. Volatility (std của log-return)
    # ---------------------------------
    df["volatility"] = df["percentage_change"].rolling(rolling_window).std()

    # ---------------------------------
    # 3. Momentum (price momentum)
    # ---------------------------------
    df["momentum"] = df["current_price"] - df["current_price"].shift(shift_period)

    # Clean data
    df = df.replace([np.inf, -np.inf], np.nan).dropna()

    return df


# phân cụm 
def perform_clustering():

    # Bước 1: Đợi dữ liệu sẵn sàng, dùng vòng lặp để chờ dữ liệu
    time.sleep(5)
    start_time = time.time()
    while True:

        df = load_price_history()
        # Nếu có dữ liệu thì thoát vòng lặp
        if not df.empty:
            print("Data ready, start clustering.")
            break
        # Nếu quá thời gian chờ thì in thông báo và tiếp tục chờ
        if time.time() - start_time > timeout:
            print("Timeout: no data available, retrying in 10s...")
            time.sleep(10)

    results = []
    # Bước 2: Phân cụm cho từng coin
    # lấy danh sách coin_id duy nhất
    coin_ids = df["coin_id"].unique()

    # lặp qua từng coin_id
    for coin in coin_ids:
        # tách dữ liệu của từng loại coin trong df và sắp xếp theo timestamp
        df_coin = df[df["coin_id"] == coin].copy()
        df_coin = df_coin.sort_values("timestamp")

        # chuẩn hóa dữ liệu "Day" trước khi phân cụm
        daily = df_coin.resample("1D", on="timestamp").agg({
            "current_price": "last",
            "market_cap": "last",
            "total_volume": "last"
        }).dropna().reset_index()

        # tính các đặc trưng xu hướng
        daily = build_trend_features(daily)

        if len(daily) >= 3:
            # Tạo ma trận đặc trưng để phân cụm, tạo mảng 2 chiều thì k cần reshape nữa
            X = daily[[
                "current_price", "market_cap", "total_volume",
                "percentage_change", "volatility", "momentum"
            ]]

            # Chuẩn hóa dữ liệu
            scaled = StandardScaler().fit_transform(X)
            km = KMeans(n_clusters=3, random_state=42)
            daily["cluster_label"] = km.fit_predict(scaled)

            # Lưu kết quả ngày cuối cùng của từng coin - iloc[-1] là để lấy giá trị mới nhất
            results.append({
                "coin_id": coin,
                "type": "day",
                "timestamp": daily["timestamp"].iloc[-1],
                "current_price": daily["current_price"].iloc[-1],
                "market_cap": daily["market_cap"].iloc[-1],
                "total_volume": daily["total_volume"].iloc[-1],
                "percentage_change": daily["percentage_change"].iloc[-1],
                "volatility": daily["volatility"].iloc[-1],
                "momentum": daily["momentum"].iloc[-1],
                "cluster_label": int(daily["cluster_label"].iloc[-1])
            })

        # Tương tự cho tuần và tháng
        weekly = df_coin.resample("7D", on="timestamp").agg({
            "current_price": "last",
            "market_cap": "last",
            "total_volume": "last"
        }).dropna().reset_index()

        weekly = build_trend_features(weekly)
        # nếu có đủ dữ liệu để phân cụm
        if len(weekly) >= 3:
            X = weekly[[
                "current_price", "market_cap", "total_volume",
                "percentage_change", "volatility", "momentum"
            ]]

            scaled = StandardScaler().fit_transform(X)
            km = KMeans(n_clusters=3, random_state=42)
            weekly["cluster_label"] = km.fit_predict(scaled)
            # Lưu kết quả tuần cuối cùng của từng coin
            results.append({
                "coin_id": coin,
                "type": "week",
                "timestamp": weekly["timestamp"].iloc[-1],
                "current_price": weekly["current_price"].iloc[-1],
                "market_cap": weekly["market_cap"].iloc[-1],
                "total_volume": weekly["total_volume"].iloc[-1],
                "percentage_change": weekly["percentage_change"].iloc[-1],
                "volatility": weekly["volatility"].iloc[-1],
                "momentum": weekly["momentum"].iloc[-1],
                "cluster_label": int(weekly["cluster_label"].iloc[-1])
            })

        # ====================================================
        # MONTHLY (MS)
        # ====================================================
        monthly = df_coin.resample("MS", on="timestamp").agg({
            "current_price": "last",
            "market_cap": "last",
            "total_volume": "last"
        }).dropna().reset_index()

        monthly = build_trend_features(monthly, rolling_window=2, shift_period=2)

        if len(monthly) >= 3:
            X = monthly[[
                "current_price", "market_cap", "total_volume",
                "percentage_change", "volatility", "momentum"
            ]]

            scaled = StandardScaler().fit_transform(X)
            km = KMeans(n_clusters=3, random_state=42)
            monthly["cluster_label"] = km.fit_predict(scaled)

            results.append({
                "coin_id": coin,
                "type": "month",
                "timestamp": monthly["timestamp"].iloc[-1],
                "current_price": monthly["current_price"].iloc[-1],
                "market_cap": monthly["market_cap"].iloc[-1],
                "total_volume": monthly["total_volume"].iloc[-1],
                "percentage_change": monthly["percentage_change"].iloc[-1],
                "volatility": monthly["volatility"].iloc[-1],
                "momentum": monthly["momentum"].iloc[-1],
                "cluster_label": int(monthly["cluster_label"].iloc[-1])
            })

    # Bước 3: Lưu kết quả phân cụm vào DB
    df_out = pd.DataFrame(results)
    save_clustered(df_out)


# chạy hàm phân cụm khi chạy file này
if __name__ == "__main__":
    print("Running clustering...")
    perform_clustering()



