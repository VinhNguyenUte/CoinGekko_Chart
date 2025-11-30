from pydantic import BaseModel
from typing import Optional

class ScatterPoint(BaseModel):
    volume: Optional[float] = None
    change: Optional[float] = None
    date: Optional[str] = None

class TrendLine(BaseModel):
    slope: Optional[float] = None
    intercept: Optional[float] = None

class ScatterDiagramModel(BaseModel):
    points: list[ScatterPoint]
    trendline: TrendLine = TrendLine()
