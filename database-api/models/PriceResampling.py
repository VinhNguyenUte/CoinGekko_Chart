from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class LineData(BaseModel):
    dates: List[datetime]
    prices: List[Optional[float]]
    ma_50: List[Optional[float]]
    boll_upper: List[Optional[float]]
    boll_lower: List[Optional[float]]
    rsi: List[Optional[float]]


class PriceResampling(BaseModel):
    coin: str
    timeframe: str
    lineData: LineData
