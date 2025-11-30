from fastapi import FastAPI
from typing import List

from queries import (
    get_price_predictions,
    get_clustered_data,
    get_price_resampling,
    get_dpo,
)

from models.PricePrediction import PricePrediction
from models.CoinClustered import CoinClustered
from models.PriceResampling import PriceResampling
from models.DPOResponse import DPOResponse


app = FastAPI()

@app.get("/")
def root():
    return {"message": "database-api is running!"}


# --------------------------------------------------------
# API: PRICE PREDICTIONS
# --------------------------------------------------------
@app.get("/price-predictions", response_model=List[PricePrediction])
def api_price_predictions():
    return get_price_predictions()


# --------------------------------------------------------
# API: COIN CLUSTERED
# --------------------------------------------------------
@app.get("/coin-clustered", response_model=List[CoinClustered])
def api_coin_clustered():
    return get_clustered_data()


# --------------------------------------------------------
# API:PRICE HISTORY 
# --------------------------------------------------------
@app.get("/price-resampling", response_model=List[PriceResampling])
def api_price_resampling():
    return get_price_resampling()

# --------------------------------------------------------
# API: DPO INDICATOR: http://localhost:8002/price-resampling/dpo?coin=bitcoin&n=21
# n = 24 -> 1 ngày, n = 7 -> 1 tuần, n =21 -> 1 tháng:
# --------------------------------------------------------
@app.get("/price-resampling/dpo", response_model=DPOResponse)
def api_price_resampling_dpo(coin: str, n: int = 21):
    return get_dpo(coin, n)

