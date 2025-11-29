from pydantic import BaseModel
from datetime import date
from typing import Optional

class PriceHistoryWeekly(BaseModel):
    id: int
    coin_id: str
    week_start_date: date
    weekly_avg_price: Optional[float] = None
    weekly_max_price: Optional[float] = None
    weekly_min_price: Optional[float] = None
    weekly_total_volume: Optional[int] = None
    weekly_avg_mkt_cap: Optional[int] = None
