import os
import time
import logging
import schedule
import psycopg2
import joblib
import pandas as pd
import numpy as np
import threading
import uvicorn

from fastapi import FastAPI, BackgroundTasks
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from urllib.parse import urlparse

# Cấu hình logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
TARGET_COINS = ["bitcoin", "ethereum", "solana", "dogecoin", "tether"]
app = FastAPI(title="Prediction Service API", description="Full AI Prediction & Classification")

# Cấu hình thư mục lưu model
MODEL_DIR = "/models"
if not os.path.exists(MODEL_DIR):
    os.makedirs(MODEL_DIR)

# Kết nối DB
def get_db_connection():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        # Fallback cho test local nếu không có env
        # db_url = "postgres://user:pass@localhost:5432/crypto_db" 
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

# Tự động tạo bảng và cập nhật schema nếu cần
def ensure_schema_exists():
    conn = get_db_connection()
    if not conn: return
    try:
        cur = conn.cursor()
        
        # 1. Tạo bảng kết quả dự đoán (Đã thêm current_price)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS price_predictions (
                id SERIAL PRIMARY KEY,
                coin_id TEXT,
                current_price DOUBLE PRECISION,  -- <--- THÊM CỘT NÀY
                predicted_price DOUBLE PRECISION,
                signal TEXT,
                confidence DOUBLE PRECISION,
                factors TEXT,
                created_at TIMESTAMP,
                prediction_target_date DATE
            )
        """)

        # 2. Migration cột (Để update bảng cũ nếu chưa có cột này)
        cols = [
            ("current_price", "DOUBLE PRECISION"), # <--- THÊM VÀO MIGRATION
            ("signal", "TEXT"),
            ("confidence", "DOUBLE PRECISION"),
            ("factors", "TEXT"),
            ("created_at", "TIMESTAMP"),
            ("prediction_target_date", "DATE")
        ]
        for col_name, col_type in cols:
            cur.execute(f"ALTER TABLE price_predictions ADD COLUMN IF NOT EXISTS {col_name} {col_type};")

        # 3. Constraint Unique
        try:
            cur.execute("ALTER TABLE price_predictions DROP CONSTRAINT IF EXISTS unique_prediction;")
            cur.execute("ALTER TABLE price_predictions DROP CONSTRAINT IF EXISTS unique_prediction_entry;")
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

# Tính các features từ dữ liệu lịch sử 
def calculate_features(df):
    df = df.sort_values(by='timestamp', ascending=True).reset_index(drop=True)

    try:
        # Price Features
        df['ma7'] = df['current_price'].rolling(window=7).mean()
        df['ma20'] = df['current_price'].rolling(window=20).mean()
        df['volatility'] = df['current_price'].rolling(window=7).std()
        
        # RSI
        delta = df['current_price'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['rsi'] = 100 - (100 / (1 + rs))
        
        # Lags là các giá trị trễ trên 1 ngày, 3 ngày, 7 ngày
        df['lag_1'] = df['current_price'].shift(1)
        df['lag_3'] = df['current_price'].shift(3)
        df['lag_7'] = df['current_price'].shift(7)

        # Volume & Market Cap Features
        df['vol_change'] = df['total_volume'].pct_change()
        df['vol_ma7'] = df['total_volume'].rolling(window=7).mean()
        df['cap_change'] = df['market_cap'].pct_change()

        # Targets
        df['next_day_price'] = df['current_price'].shift(-1)
        df['target_trend'] = (df['next_day_price'] > df['current_price']).astype(int)
        
        df.dropna(subset=['ma20', 'rsi', 'lag_7', 'vol_ma7'], inplace=True)

        return df
    except Exception as e:
        logging.error(f"Feature Calculation Error: {e}")
        return df

# --- LẤY DỮ LIỆU ---
def get_historical_data(coin_id):
    conn = get_db_connection()
    if not conn: return None
    try:
        query = """
            SELECT DISTINCT ON ("timestamp"::date)
                "timestamp", 
                current_price, 
                market_cap, 
                total_volume 
            FROM price_history 
            WHERE coin_id = %s 
              AND "timestamp" >= NOW() - INTERVAL '365 days'
            ORDER BY "timestamp"::date ASC, "timestamp" DESC
        """
        df = pd.read_sql_query(query, conn, params=(coin_id,))
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        return df
    except Exception as e:
        logging.error(f"Fetch Error {coin_id}: {e}")
        return None
    finally:
        conn.close()

# --- LƯU KẾT QUẢ ---
def save_to_db(coin_id, current_price, predicted_price, signal, confidence, factors):
    conn = get_db_connection()
    if not conn: return
    try:
        cur = conn.cursor()
        now = datetime.now()
        target_date = now.date() + timedelta(days=1)

        # Đã cập nhật câu lệnh INSERT để bao gồm current_price
        cur.execute("""
            INSERT INTO price_predictions 
            (coin_id, current_price, predicted_price, signal, confidence, factors, created_at, prediction_target_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (coin_id, created_at) DO NOTHING;
        """, (coin_id, float(current_price), float(predicted_price), signal, float(confidence), factors, now, target_date))
        
        conn.commit()
        cur.close()
        logging.info(f"✅ Predicted {coin_id}: Now ${current_price:.2f} -> Next ${predicted_price:.2f} | {signal}")
    except Exception as e:
        logging.error(f"Save Error: {e}")
    finally:
        conn.close()

# define feature list used globally
FEATURES = [
    'lag_1', 'lag_3', 'lag_7', 
    'ma7', 'ma20', 'volatility', 'rsi',
    'vol_change', 'vol_ma7', 'cap_change'
]

# ==============================================================================
# 1. TRAINING TASK
# ==============================================================================
def run_training_task():
    logging.info(">>> STARTING MODEL TRAINING TASK...")
    ensure_schema_exists()
    
    for coin in TARGET_COINS:
        df = get_historical_data(coin)
        if df is None or len(df) < 30:
            logging.warning(f"Skipping TRAIN {coin}: Not enough data.")
            continue

        df = calculate_features(df)
        
        # Bỏ dòng cuối cùng
        df_train = df.dropna(subset=['next_day_price']).copy()
        if len(df_train) < 20: continue

        X_train = df_train[FEATURES]
        y_price = df_train['next_day_price']
        y_trend = df_train['target_trend']

        try:
            # 1. Train Price Model (Regressor)
            reg_path = os.path.join(MODEL_DIR, f"{coin}_price.pkl")
            reg_model = RandomForestRegressor(n_estimators=100, random_state=42)
            reg_model.fit(X_train, y_price)
            joblib.dump(reg_model, reg_path)
            logging.info(f"💾 Saved Price Model: {coin}")

            # 2. Train Trend Model (Classifier)
            clf_path = os.path.join(MODEL_DIR, f"{coin}_trend.pkl")
            clf_model = RandomForestClassifier(n_estimators=100, random_state=42)
            clf_model.fit(X_train, y_trend)
            joblib.dump(clf_model, clf_path)
            logging.info(f"Đã lưu model cho {coin}")

        except Exception as e:
            logging.error(f"Train thất bại {coin}: {e}")

    logging.info("TRAINING Thành công.")

# ==============================================================================
# 2. PREDICTION TASK
# ==============================================================================
def run_prediction_task():
    logging.info(">>> STARTING PREDICTION TASK...")
    ensure_schema_exists()
    for coin in TARGET_COINS:
        reg_path = os.path.join(MODEL_DIR, f"{coin}_price.pkl")
        clf_path = os.path.join(MODEL_DIR, f"{coin}_trend.pkl")
        
        if not os.path.exists(reg_path) or not os.path.exists(clf_path):
            logging.warning(f"Không tìm thấy model cho {coin}. Vui lòng chạy /train trước.")
            continue

        df = get_historical_data(coin)
        if df is None or len(df) < 30: continue
        df = calculate_features(df)
        
        last_row = df.iloc[[-1]]
        # KIỂM TRA DỮ LIỆU ĐẦY ĐỦ
        if last_row[FEATURES].isnull().values.any():
            logging.warning(f"Skipping {coin}: Dữ liệu ngày mới nhất chưa đủ để tính chỉ báo.")
            continue
        X_pred = last_row[FEATURES]
        
        # LẤY GIÁ HIỆN TẠI TỪ DỮ LIỆU
        current_price = float(last_row['current_price'].values[0])

        try:
            reg_model = joblib.load(reg_path)
            predicted_price = reg_model.predict(X_pred)[0]

            clf_model = joblib.load(clf_path)
            pred_class = clf_model.predict(X_pred)[0]
            pred_proba = clf_model.predict_proba(X_pred)[0]
            confidence = max(pred_proba) * 100
            
            # ... (Đoạn lấy current_price và predicted_price)

            # 1. Tính % lợi nhuận kỳ vọng
            price_change_pct = ((predicted_price - current_price) / current_price) * 100

            # 2. Ngưỡng tối thiểu để vào lệnh (Ví dụ: phải lãi hơn phí sàn 0.1% + trượt giá)
            MIN_PROFIT_THRESHOLD = 0.5  # 0.5%

            # 3. Logic ra quyết định
            if pred_class == 1: # Classifier bảo TĂNG
                if price_change_pct >= MIN_PROFIT_THRESHOLD:
                    signal = "STRONG BUY"
                    trend_text = f"UP (+{price_change_pct:.2f}%)"
                elif price_change_pct > 0:
                    signal = "WEAK BUY" # Tăng nhưng không đủ bù phí
                    trend_text = f"UP (Only +{price_change_pct:.2f}%)"
                else:
                    signal = "CONFLICT" # Classifier bảo Tăng mà Giá dự đoán lại Giảm
                    trend_text = f"Trend: {'UP' if pred_class == 1 else 'DOWN'} but Price Change: {price_change_pct:.2f}%"

            elif pred_class == 0: # Classifier bảo GIẢM
                if price_change_pct <= -MIN_PROFIT_THRESHOLD:
                    signal = "STRONG SELL"
                    trend_text = f"DOWN ({price_change_pct:.2f}%)"
                else:
                    signal = "NEUTRAL" # Giảm nhưng không đủ để vào lệnh
                    trend_text = "Sideway"

            # ... (Lưu signal và trend_text vào DB)
            
            try:
                importances = clf_model.feature_importances_
                top_idx = np.argmax(importances)
                top_feature = FEATURES[top_idx]
            except:
                top_feature = "Unknown"

            factors = f"Trend: {trend_text} | Key: {top_feature}"
            
            # TRUYỀN current_price VÀO HÀM SAVE
            save_to_db(coin, current_price, predicted_price, signal, confidence, factors)
            
        except Exception as e:
            logging.error(f"Prediction Error {coin}: {e}")
    
    logging.info("PREDICTION THÀNH CÔNG.")

# --- API ---
@app.post("/predict")
async def trigger_prediction(background_tasks: BackgroundTasks):
    """Chỉ kích hoạt dự đoán"""
    background_tasks.add_task(run_prediction_task)
    return {"status": "Prediction triggered"}

@app.post("/train")
async def trigger_training(background_tasks: BackgroundTasks):
    """Kích hoạt huấn luyện"""
    background_tasks.add_task(run_training_task)
    return {"status": "Training đa được kích hoạt"}

# --- SCHEDULER ---
def run_scheduler():
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    time.sleep(8) 
    try:
        test_path = os.path.join(MODEL_DIR, f"{TARGET_COINS[0]}_price.pkl")
        if not os.path.exists(test_path):
            logging.info("First run detected (no models). Starting initial training...")
            t_train = threading.Thread(target=run_training_task)
            t_train.start()
            t_train.join()
        else:
            logging.info("First run detected (models exist). Starting server...")
            # Chạy trong thread riêng để không block việc start uvicorn
            run_prediction_task()
    except Exception as e:
        logging.error(f"Startup error: {e}")
    
    schedule.every(5).minutes.do(run_prediction_task)
    schedule.every(24).hours.do(run_training_task)
    
    t = threading.Thread(target=run_scheduler, daemon=True)
    t.start()
    uvicorn.run(app, host="0.0.0.0", port=5003)