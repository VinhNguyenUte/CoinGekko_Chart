from pydantic import BaseModel
from typing import List


class CorrelationHeatmap(BaseModel):
    labels: List[str] 
    z_values: List[List[float]]  
