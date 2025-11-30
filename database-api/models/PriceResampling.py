from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PriceResampling(BaseModel):
    id: int
    coin_id: str
    timestamp: Optional[datetime] = None
    current_price: Optional[float] = None
    price_max: Optional[float] = None
    price_min: Optional[float] = None
    upper_band: Optional[float] = None
    lower_band: Optional[float] = None
    price_rsi: Optional[float] = None
    market_cap: Optional[int] = None
    total_volume: Optional[int] = None
    type: Optional[str] = None