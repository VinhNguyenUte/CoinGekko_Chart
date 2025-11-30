from db import get_connection

from models.PricePrediction import PricePrediction
from models.CoinClustered import CoinClustered
from models.PriceResampling import PriceResampling

from models.LineDiagramModel import LineDiagramModel, HistoryPoint, BolingerBands
from models.ScatterDiagramModel import ScatterDiagramModel, ScatterPoint, TrendLine
from models.HistogramDiagramModel import HistogramDiagramModel, HistogramStats
import math
import pandas as pd
from typing import List

def _sanitize_float(x):
    """Return a JSON-safe float or None for NaN/inf values."""
    if x is None:
        return None
    try:
        f = float(x)
    except Exception:
        return None
    if not math.isfinite(f):
        return None
    return f


def _sanitize_int(x):
    if x is None:
        return None
    try:
        return int(x)
    except Exception:
        return None

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
def get_price_resampling_all():
    conn = get_connection()
    cur = conn.cursor()
    print("Fetching resampling data from database...")
    cur.execute("""
        SELECT id, coin_id, timestamp, current_price, price_max, price_min,
               upper_band, lower_band, price_rsi,market_cap, total_volume, type
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
            current_price=_sanitize_float(r[3]),
            price_max=_sanitize_float(r[4]),
            price_min=_sanitize_float(r[5]),
            upper_band=_sanitize_float(r[6]),
            lower_band=_sanitize_float(r[7]),
            price_rsi=_sanitize_float(r[8]),
            market_cap=_sanitize_int(r[9]),
            total_volume=_sanitize_int(r[10]),
            type=r[11]
        )
        for r in rows
    ]

# -----------------------------
# PRICE RESAMPLING BY TYPE
# -----------------------------
def get_price_resampling_by_type(resample_type: str):
    conn = get_connection()
    cur = conn.cursor()
    print(f"Fetching resampling data of type '{resample_type}' from database...")
    
    # BƯỚC 1: SELECT đầy đủ 12 cột (đã bao gồm các chỉ báo đã tính toán)
    cur.execute("""
        SELECT id, coin_id, timestamp, current_price, price_max, price_min,
               upper_band, lower_band, price_rsi,
               market_cap, total_volume, type
        FROM price_resampling
        WHERE type = %s
        ORDER BY timestamp ASC
    """, (resample_type,))
    
    rows = cur.fetchall()
    conn.close()
    
    # BƯỚC 2: Ánh xạ 12 cột vào mô hình PriceResampling
    return [
        PriceResampling(
            id=r[0],
            coin_id=r[1],
            timestamp=r[2],
                current_price=_sanitize_float(r[3]),
                price_max=_sanitize_float(r[4]),
                price_min=_sanitize_float(r[5]),
            
                # Lấy các giá trị đã được tính toán và lưu trong DB (sanitize)
                upper_band=_sanitize_float(r[6]),
                lower_band=_sanitize_float(r[7]),
                price_rsi=_sanitize_float(r[8]),
            
                market_cap=_sanitize_int(r[9]),
                total_volume=_sanitize_int(r[10]),
                type=r[11]
        )
        for r in rows
    ]


# -----------------------------
# START LINE DIAGRAM DATA
# -----------------------------

def calculate_ma_20(prices: list[float], window: int) -> float:
    if len(prices) < window:
        return None
    return sum(prices[len(prices) - window : len(prices)]) / window

def calculate_std(prices: list[float], ma_20: float) -> float:
    n = len(prices)
    if n == 0:
        return 0.0
    variance = sum((p - ma_20) ** 2 for p in prices) / n
    return math.sqrt(variance)


def calculate_rsi(prices: list[float], period: int = 14) -> float | None:
    n = len(prices)
    if n <= period:
        return None

    gains = 0.0
    losses = 0.0

    # lấy 14 phiên gần nhất
    for i in range(n - period, n):
        change = prices[i] - prices[i - 1]
        if change > 0:
            gains += change
        else:
            losses += -change

    if losses == 0:
        return 100.0

    average_gain = gains / period
    average_loss = losses / period
    rs = average_gain / average_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi


def build_line_diagram(rows: list[PriceResampling]) -> LineDiagramModel:
    prices = [r.current_price for r in rows]
    history_list = []
    window_ma = 20

    for i, row in enumerate(rows):

        ma_20 = calculate_ma_20(prices[i - window_ma + 1 : i + 1], window_ma)

        if ma_20 is not None:
            std = calculate_std(prices[i - window_ma + 1 : i + 1], ma_20)
            upper = ma_20 + (2 * std)
            lower = ma_20 - (2 * std)
        else:
            upper = None
            lower = None

        rsi = calculate_rsi(prices[i - window_ma + 1 : i + 1], 14) 

        history_list.append(
            HistoryPoint(
                timestamp = row.timestamp,
                price = row.current_price,
                ma_20 = ma_20,
                boll = BolingerBands(upper=upper, lower=lower),
                rsi = rsi
            )
        )
    return LineDiagramModel(history=history_list)

# -----------------------------
# END LINE DIAGRAM DATA
# -----------------------------

# -----------------------------
# START SCATTER DIAGRAM DATA
# -----------------------------

def calculate_change_percentage(current_price: float, previous_price: float) -> float:
    if previous_price == 0:
        return 0
    change = ((current_price - previous_price) / previous_price) * 100
    return change

def trend_line_linearRegresstion(volumes: list[float], changes: list[float]) -> TrendLine:
    
    n = len(volumes)
    if n == 0:
        return TrendLine(slope=0, intercept=0)

    sum_x = sum(volumes)
    sum_y = sum(changes)
    sum_xy = sum(volumes[i] * changes[i] for i in range(n))
    sum_x2 = sum(v * v for v in volumes)

    denominator = n * sum_x2 - sum_x * sum_x
    if denominator == 0:
        intercept = sum_y / n
        return TrendLine(slope=0, intercept=float(f"{intercept:.6f}"))

    slope = (n * sum_xy - sum_x * sum_y) / denominator
    intercept = (sum_y - slope * sum_x) / n

    slope = float(f"{slope:.6f}")
    intercept = float(f"{intercept:.6f}")

    return TrendLine(slope=slope, intercept=intercept)



def build_scatter_diagram(rows: list[PriceResampling]) -> ScatterDiagramModel:
    
    points = []
    volumes = []
    changes = []

    for i in range(1, len(rows)):
        today = rows[i]
        yesterday = rows[i - 1]

        change = calculate_change_percentage(today.current_price, yesterday.current_price)

        volumes.append(today.total_volume / 1_000_000) 
        changes.append(change)

        points.append(
            ScatterPoint(
                volume =today.total_volume,
                change = change,
                date = today.timestamp.date().isoformat()
            )
        )

    trend = trend_line_linearRegresstion(volumes, changes)

    return ScatterDiagramModel(points=points, trendline=trend)


# -----------------------------
# END SCATTER DIAGRAM DATA
# -----------------------------



# -----------------------------
# START HISTOGRAM DIAGRAM DATA
# -----------------------------

def calculate_daily_return(current_price: float, previous_price: float) -> float:
    if previous_price == 0:
        return 0.0
    daily_return = ((current_price - previous_price) / previous_price) * 100
    return daily_return

def calculate_mean(values: list[float]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)

def calculate_std_dev(values: list[float], mean: float) -> float:
    n = len(values)
    if n < 2:
        return 0.0
    variance = sum((v - mean) ** 2 for v in values) / (n - 1)
    return math.sqrt(variance)


def calculate_max_drawdown(prices: list[float]) -> float:
    if not prices:
        return 0.0
    peak = prices[0]
    max_dd = 0.0
    for price in prices:
        if price > peak:
            peak = price
        dd = (price - peak) / peak * 100
        if dd < max_dd:
            max_dd = dd
    return max_dd

def build_histogram_diagram(rows: list[PriceResampling], coin_name: str) -> HistogramDiagramModel:
    daily_returns = []
    prices = []

    for i in range(1,len(rows)):
        prices.append(rows[i].current_price)
        if i == 0:
            continue
        today = rows[i]
        yesterday = rows[i-1]
        daily_return = calculate_daily_return(today.current_price, yesterday.current_price)
        daily_returns.append(daily_return)

    mean = calculate_mean(daily_returns)
    std_dev = calculate_std_dev(daily_returns, mean)
    max_drawdown = calculate_max_drawdown(prices)

    stats = HistogramStats(
        mean=float(f"{mean:.6f}"),
        std_dev=float(f"{std_dev:.6f}"),
        max_drawdown=float(f"{max_drawdown:.6f}")
    )

    return HistogramDiagramModel(
        coin=coin_name,
        stats=stats,
        daily_returns=[float(f"{r:.6f}") for r in daily_returns]
    )
# -----------------------------
# END HISTOGRAM DIAGRAM DATA
# -----------------------------



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
