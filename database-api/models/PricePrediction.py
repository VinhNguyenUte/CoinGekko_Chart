from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class PricePrediction(BaseModel):
    coin_id: str
    current_price: float
    predicted_price: float
    signal: str
    confidence: float
    factors: str
    prediction_target_date: date
    created_at: datetime