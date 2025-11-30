from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class BolingerBands(BaseModel):
    upper: Optional[float] = None
    lower: Optional[float] = None

class HistoryPoint(BaseModel):
    timestamp: datetime
    price: float
    ma_20: Optional[float] = None
    boll: BolingerBands = BolingerBands()
    rsi: Optional[float] = None

class LineDiagramModel(BaseModel):
    history: list[HistoryPoint] = []
