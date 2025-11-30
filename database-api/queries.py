from db import get_connection
from fastapi import APIRouter, Query
from models.PricePrediction import PricePrediction
from models.CoinClustered import CoinClustered
from models.PriceResampling import PriceResampling
from typing import List
import pandas as pd
import math

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
    print("Fetching clustered data from database...")
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
# PRICE RESAMPLING 
# -----------------------------
def get_price_resampling():
    conn = get_connection()
    cur = conn.cursor()
    print("Fetching resampling data from database...")
    cur.execute("""
        SELECT id, coin_id, timestamp, current_price,price_max, price_min,
               market_cap, total_volume, type
        FROM price_resampling
        ORDER BY timestamp ASC
    """)
    rows = cur.fetchall()
    conn.close()
    return [
        PriceResampling(
            id=r[0],
            coin_id=r[1],
            timestamp=r[2],
            current_price=r[3],
            price_max=r[4],
            price_min=r[5],
            market_cap=r[6],
            total_volume=r[7],
            type=r[8]
        )
        for r in rows
    ]

# -----------------------------
# Detrended Price Oscillator (DPO)
# -----------------------------
def get_dpo(coin: str, n: int):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT timestamp, current_price
        FROM price_resampling
        WHERE coin_id = %s
        ORDER BY timestamp ASC
    """, (coin,))

    rows = cur.fetchall()
    conn.close()

    if not rows:
        return {
            "coin": coin,
            "indicator_config": f"DPO_{n}",
            "data": []
        }


    # Convert to DataFrame
    df = pd.DataFrame(rows, columns=["timestamp", "price"])
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)

    # -----------------------------
    # DPO CALCULATION
    # -----------------------------
    shift = (n // 2) + 1

    df["SMA"] = df["price"].rolling(window=n).mean()
    df["Shifted_SMA"] = df["SMA"].shift(shift)

    df["DPO"] = df["price"] - df["Shifted_SMA"]

    df = df.dropna()

    # -----------------------------
    # FORMAT OUTPUT
    # -----------------------------
    result = {
    "coin": coin,
    "indicator_config": f"DPO_{n}",
    "data": [
        {
            "date": str(row["timestamp"]),
            "value": float(row["DPO"])
        }
        for row in df.to_dict(orient="records")
        ]
    }

    return result
