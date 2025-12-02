from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# class BolingerBands(BaseModel):
#     upper: Optional[float] = None
#     lower: Optional[float] = None



class LineDiagramModel(BaseModel):
    coin: Optional[str] = None
    timestamp: list[datetime] = []
    price: list[float] = []
    ma_20: list[Optional[float]] = []
    # boll: list[BolingerBands] = []
    boll_upper: list[Optional[float]] = []
    boll_lower: list[Optional[float]] = []
    rsi: list[Optional[float]] = []

