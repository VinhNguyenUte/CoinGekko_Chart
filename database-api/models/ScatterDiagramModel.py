from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ScatterPoint(BaseModel):
    volume: list[float] = []
    change: list[float] = []
    date:   list[datetime] = []

class TrendLine(BaseModel):
    slope: Optional[float] = None
    intercept: Optional[float] = None

class ScatterDiagramModel(BaseModel):
    points: ScatterPoint = ScatterPoint()
    trendline: TrendLine = TrendLine()
