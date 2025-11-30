from pydantic import BaseModel
from typing import List

class DPOItem(BaseModel):
    date: str
    value: float

class DPOResponse(BaseModel):
    coin: str
    indicator_config: str
    data: List[DPOItem]
