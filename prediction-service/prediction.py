import os
import time
import logging
import schedule
import psycopg2
import pandas as pd
import numpy as np
import threading
import uvicorn
from fastapi import FastAPI, BackgroundTasks
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from urllib.parse import urlparse

# --- CẤU HÌNH ---
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
TARGET_COINS = ["bitcoin", "ethereum", "solana", "dogecoin", "tether"]
app = FastAPI(title="Prediction Service API", description="Full AI Prediction & Classification")

# --- KẾT NỐI DB ---
def get_db_connection():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        logging.error("DATABASE_URL not set.")
        return None
    try:
        parsed = urlparse(db_url)
        conn = psycopg2.connect(
            dbname=parsed.path.lstrip("/"), user=parsed.username,
            password=parsed.password, host=parsed.hostname, port=parsed.port
        )
        return conn
    except Exception as e:
        logging.error(f"DB Connect Error: {e}")
        return None

# --- AUTO MIGRATION (CẬP NHẬT CẤU TRÚC BẢNG) ---
def ensure_schema_exists():
    conn = get_db_connection()
    if not conn: return
    try:
        cur = conn.cursor()
        
        # 1. Tạo bảng nếu chưa có
        cur.execute("""
            CREATE TABLE IF NOT EXISTS price_predictions (
                id SERIAL PRIMARY KEY,
                coin_id TEXT,
                predicted_price DOUBLE PRECISION,
                signal TEXT,
                confidence DOUBLE PRECISION,
                factors TEXT,
                created_at TIMESTAMP,
                prediction_target_date DATE
            )
        """)

        # 2. Thêm các cột nếu thiếu (Migration cho DB cũ)
        # Lưu ý: prediction_target_date là cột quan trọng để vẽ biểu đồ
        cols = [
            ("signal", "TEXT"),
            ("confidence", "DOUBLE PRECISION"),
            ("factors", "TEXT"),
            ("created_at", "TIMESTAMP"),
            ("prediction_target_date", "DATE")
        ]
        for col_name, col_type in cols:
            cur.execute(f"ALTER TABLE price_predictions ADD COLUMN IF NOT EXISTS {col_name} {col_type};")

        # 3. Đảm bảo ràng buộc UNIQUE theo thời gian tạo (để lưu lịch sử)
        try:
            # Xóa constraint cũ nếu nó chỉ unique theo coin_id
            cur.execute("ALTER TABLE price_predictions DROP CONSTRAINT IF EXISTS unique_prediction;")
            cur.execute("ALTER TABLE price_predictions DROP CONSTRAINT IF EXISTS unique_prediction_entry;")
            
            # Tạo constraint mới: Một coin có thể có nhiều dự báo, miễn là khác thời gian tạo
            cur.execute("""
                ALTER TABLE price_predictions 
                ADD CONSTRAINT unique_prediction_entry UNIQUE (coin_id, created_at);
            """)
        except Exception as e:
            logging.warning(f"Constraint adjustment warning: {e}")

        conn.commit()
        cur.close()
    except Exception as e:
        logging.error(f"Schema Update Error: {e}")
    finally:
        conn.close()

# --- FEATURE ENGINEERING ---
def calculate_features(df):
    try:
        # Trend
        df['ma7'] = df['current_price'].rolling(window=7).mean()
        df['ma20'] = df['current_price'].rolling(window=20).mean()
        df['volatility'] = df['current_price'].rolling(window=7).std()
        
        # RSI
        delta = df['current_price'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['rsi'] = 100 - (100 / (1 + rs))
        
        # Lags
        df['lag_1'] = df['current_price'].shift(1)
        df['lag_3'] = df['current_price'].shift(3)
        df['lag_7'] = df['current_price'].shift(7)
        df['lag_14'] = df['current_price'].shift(14)

        # Targets
        df['next_day_price'] = df['current_price'].shift(-1)
        df['target_trend'] = (df['next_day_price'] > df['current_price']).astype(int)
        
        return df
    except Exception as e:
        logging.error(f"Feature Calculation Error: {e}")
        return df

# --- LẤY DỮ LIỆU ---
def get_historical_data(coin_id):
    conn = get_db_connection()
    if not conn: return None
    try:
        query = "SELECT timestamp, current_price FROM price_history WHERE coin_id = %s ORDER BY timestamp ASC LIMIT 365"
        df = pd.read_sql_query(query, conn, params=(coin_id,))
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        return df
    except Exception as e:
        logging.error(f"Fetch Error {coin_id}: {e}")
        return None
    finally:
        conn.close()

# --- LƯU VÀO DB (APPEND HISTORY) ---
def save_to_db(coin_id, price, signal, confidence, factors):
    conn = get_db_connection()
    if not conn: return
    try:
        cur = conn.cursor()
        
        # Thời gian hiện tại (Lúc chạy code)
        now = datetime.now()
        # Dự báo cho ngày mai
        target_date = now.date() + timedelta(days=1)

        # INSERT dữ liệu mới (KHÔNG DELETE cũ)
        cur.execute("""
            INSERT INTO price_predictions 
            (coin_id, predicted_price, signal, confidence, factors, created_at, prediction_target_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (coin_id, created_at) DO NOTHING;
        """, (coin_id, float(price), signal, float(confidence), factors, now, target_date))
        
        conn.commit()
        cur.close()
        logging.info(f"💾 Saved History {coin_id}: ${price:.2f} | {signal} | Time: {now.strftime('%H:%M:%S')}")
    except Exception as e:
        logging.error(f"Save Error: {e}")
    finally:
        conn.close()

# --- AI TASK ---
def run_prediction_task():
    logging.info(">>> 🤖 STARTING AI PREDICTION (History Mode)...")
    ensure_schema_exists()
    
    features = ['lag_1', 'lag_3', 'lag_7', 'ma7', 'ma20', 'volatility', 'rsi']
    
    for coin in TARGET_COINS:
        df = get_historical_data(coin)
        if df is None or len(df) < 30:
            logging.warning(f"Skipping {coin}: Not enough data.")
            continue

        df = calculate_features(df)
        df_train = df.dropna(subset=features + ['next_day_price', 'target_trend']).copy()
        last_row = df.iloc[[-1]] 
        
        if len(df_train) < 20: continue
            
        try:
            X_train = df_train[features]
            X_pred = last_row[features].fillna(0)
            
            # 1. Regressor (Price)
            y_price = df_train['next_day_price']
            reg_model = RandomForestRegressor(n_estimators=100, random_state=42)
            reg_model.fit(X_train, y_price)
            predicted_price = reg_model.predict(X_pred)[0]
            
            # 2. Classifier (Signal)
            y_trend = df_train['target_trend']
            clf_model = RandomForestClassifier(n_estimators=100, random_state=42)
            clf_model.fit(X_train, y_trend)
            
            pred_class = clf_model.predict(X_pred)[0]
            pred_proba = clf_model.predict_proba(X_pred)[0]
            confidence = max(pred_proba) * 100
            
            if pred_class == 1:
                signal = "BUY"
                trend_text = "UP"
            else:
                signal = "SELL"
                trend_text = "DOWN"
            
            importances = clf_model.feature_importances_
            top_idx = np.argmax(importances)
            top_feature = features[top_idx]
            factors = f"AI: {trend_text} | Top: {top_feature}"
            
            # Lưu
            save_to_db(coin, predicted_price, signal, confidence, factors)
            
        except Exception as e:
            logging.error(f"ML Error {coin}: {e}")
    
    logging.info(">>> ✅ AI TASK FINISHED.")

# --- API & SCHEDULER ---
@app.post("/run-prediction")
async def trigger_prediction(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_prediction_task)
    return {"status": "triggered"}

def run_scheduler():
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    try:
        schedule.sleep(10)
        run_prediction_task()
    except: pass
    
    schedule.every(5).minutes.do(run_prediction_task)
    t = threading.Thread(target=run_scheduler, daemon=True)
    t.start()
    uvicorn.run(app, host="0.0.0.0", port=5003)