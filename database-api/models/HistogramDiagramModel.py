from pydantic import BaseModel
from typing import Optional


class HistogramStats(BaseModel):
    mean: Optional[float] = None
    std_dev: Optional[float] = None
    max_drawdown: Optional[float] = None

class HistogramDiagramModel(BaseModel):
    coin: str
    stats: HistogramStats = HistogramStats()
    daily_returns: Optional[list[float]] = None