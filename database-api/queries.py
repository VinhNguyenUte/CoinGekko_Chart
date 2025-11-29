from db import get_connection

from models.PricePrediction import PricePrediction
from models.CoinClustered import CoinClustered
from models.PriceHistoryWeekly import PriceHistoryWeekly


# -----------------------------
# PRICE PREDICTIONS
# -----------------------------
def get_price_predictions():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, coin_id, coin_name, predicted_price, actual_price
        FROM price_predictions
        ORDER BY id ASC
    """)
    
    rows = cur.fetchall()
    conn.close()

    return [
        PricePrediction(
            id=r[0],
            coin_id=r[1],
            coin_name=r[2],
            predicted_price=r[3],
            actual_price=r[4]
        )
        for r in rows
    ]


# -----------------------------
# COIN CLUSTERED
# -----------------------------
def get_clustered_data():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, coin_id, timestamp, current_price, market_cap,
               total_volume, percentage_change, volatility,
               momentum, cluster_label, type
        FROM coin_clustered
        ORDER BY timestamp ASC
    """)
    
    rows = cur.fetchall()
    conn.close()

    return [
        CoinClustered(
            id=r[0],
            coin_id=r[1],
            timestamp=r[2],
            current_price=r[3],
            market_cap=r[4],
            total_volume=r[5],
            percentage_change=r[6],
            volatility=r[7],
            momentum=r[8],
            cluster_label=r[9],
            type=r[10]
        )
        for r in rows
    ]


# -----------------------------
# PRICE HISTORY WEEKLY
# -----------------------------
def get_weekly_history():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, coin_id, week_start_date, weekly_avg_price,
               weekly_max_price, weekly_min_price,
               weekly_total_volume, weekly_avg_mkt_cap
        FROM price_history_weekly
        ORDER BY week_start_date ASC
    """)

    rows = cur.fetchall()
    conn.close()

    return [
        PriceHistoryWeekly(
            id=r[0],
            coin_id=r[1],
            week_start_date=r[2],
            weekly_avg_price=r[3],
            weekly_max_price=r[4],
            weekly_min_price=r[5],
            weekly_total_volume=r[6],
            weekly_avg_mkt_cap=r[7]
        )
        for r in rows
    ]
