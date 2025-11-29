from fastapi import FastAPI
from typing import List

from queries import (
    get_price_predictions,
    get_clustered_data,
    get_price_resampling
)

from models.PricePrediction import PricePrediction
from models.CoinClustered import CoinClustered
from models.PriceResampling import PriceResampling

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

