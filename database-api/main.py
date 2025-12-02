from fastapi import FastAPI, Query
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from queries import (
    # get_price_predictions,
    get_clustered_data,
    get_price_resampling_all,
    get_price_resampling_for_trend_diagram,
    get_price_resampling_by_type,
    build_line_diagram,
    build_scatter_diagram,
    build_histogram_diagram,
    get_dpo,
    get_dashboard_data
)

# from models.PricePrediction import PricePrediction
from models.CoinClustered import CoinClustered
from models.PriceResampling import PriceResampling
from models.LineDiagramModel import LineDiagramModel
from models.ScatterDiagramModel import ScatterDiagramModel
from models.HistogramDiagramModel import HistogramDiagramModel
from models.DPOResponse import DPOResponse
from models.DashBoardModel import CorrelationHeatmap

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # hoặc ["http://127.0.0.1:5500"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def root():
    return {"message": "database-api is running!"}


# --------------------------------------------------------
# API: PRICE PREDICTIONS
# --------------------------------------------------------
# @app.get("/price-predictions", response_model=List[PricePrediction])
# def api_price_predictions():
#     return get_price_predictions()


# --------------------------------------------------------
# API: COIN CLUSTERED
# --------------------------------------------------------
@app.get("/coin-clustered", response_model=List[CoinClustered])
def api_coin_clustered():
    return get_clustered_data()


# API: API DASHBOARD
# http://localhost:8002/
@app.get("/dashboard", response_model=CorrelationHeatmap)
def api_get_dashboard(type: str = Query("day")):
    rows = get_price_resampling_all()
    filtered = []
    for r in rows:
        type_match = r.type.lower() == type.lower()
        if type_match:
            filtered.append(r)
    
    return get_dashboard_data(filtered)




# --------------------------------------------------------
# API: PRICE RESAMPLING FOR TREND DIAGRAM
# http://localhost:8002/price-resampling
# --------------------------------------------------------
@app.get("/price-resampling", response_model=List[PriceResampling])
def api_price_resampling():
    return get_price_resampling_for_trend_diagram()


# --------------------------------------------------------
# API: PRICE RESAMPLING BY TYPE FOR TREND DIAGRAM
# http://localhost:8002/price-resampling/day
# --------------------------------------------------------
@app.get("/price-resampling/{resample_type}", response_model=List[PriceResampling])
def api_price_resampling_by_type(resample_type: str):
    return get_price_resampling_by_type(resample_type)



# --------------------------------------------------------
# API :LINE DIAGRAM
# http://localhost:8002/line-diagram?coin=bitcoin&type=day
# --------------------------------------------------------
@app.get("/line-diagram", response_model=LineDiagramModel)
def api_line_diagram(coin: str = Query("bitcoin"),
                     type: str = Query("day")):
    rows = get_price_resampling_all()
    filtered = []
    for r in rows:
        coin_match = r.coin_id.lower() == coin.lower()
        type_match = r.type.lower() == type.lower()
        if coin_match and type_match:
            filtered.append(r)
    
    return build_line_diagram(filtered)


# --------------------------------------------------------
# API :SCATTER DIAGRAM
# http://localhost:8002/scatter-diagram?coin=bitcoin&type=day

# --------------------------------------------------------

@app.get("/scatter-diagram", response_model=ScatterDiagramModel)
def api_scatter_diagram(coin: str = Query("bitcoin"),
                        type: str = Query("day")):
    rows = get_price_resampling_all()
    filtered = []
    for r in rows:
        coin_match = r.coin_id.lower() == coin.lower()
        type_match = r.type.lower() == type.lower()
        if coin_match and type_match:
            filtered.append(r)
    
    return build_scatter_diagram(filtered)

# --------------------------------------------------------
# API :HISTOGRAM DIAGRAM
# http://localhost:8002/histogram-diagram?coin=bitcoin&type=day

# --------------------------------------------------------
@app.get("/histogram-diagram", response_model=HistogramDiagramModel)
def api_histogram_diagram(coin: str = Query("bitcoin"), type: str = Query("day")):
   
    rows = get_price_resampling_all()
    filtered = []
    for r in rows:
        coin_match = r.coin_id.lower() == coin.lower()
        type_match = r.type.lower() == type.lower()
        if coin_match and type_match:
            filtered.append(r)

    return build_histogram_diagram(filtered, coin_name=coin)

# --------------------------------------------------------
# API: DPO INDICATOR: http://localhost:8002/seasonal-diagram/dpo?coin=bitcoin&interval=week&n=3
# # n = DPO = day<=120 / week<=16 / month <=3 -> interval = day/week/month
# -----------------------------------------
# --------------------------------------------------------
@app.get("/seasonal-diagram/dpo", response_model=DPOResponse)
def api_price_resampling_dpo(coin: str, interval: str = "day", n: int = 21):
    return get_dpo(coin, n, interval)