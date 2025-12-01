from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class BolingerBands(BaseModel):
    upper: Optional[float] = None
    lower: Optional[float] = None



class LineDiagramModel(BaseModel):
    timestamp: list[datetime] = []
    price: list[float] = []
    ma_20: list[Optional[float]] = []
    boll: list[BolingerBands] = []
    rsi: list[Optional[float]] = []

