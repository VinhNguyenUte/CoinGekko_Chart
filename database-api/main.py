from fastapi import FastAPI
from typing import List

from queries import (
    get_price_predictions,
    get_clustered_data,
    get_weekly_history
)

from models.PricePrediction import PricePrediction
from models.CoinClustered import CoinClustered
from models.PriceHistoryWeekly import PriceHistoryWeekly

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
# API: WEEKLY HISTORY
# --------------------------------------------------------
@app.get("/price-history-weekly", response_model=List[PriceHistoryWeekly])
def api_price_history_weekly():
    return get_weekly_history()
