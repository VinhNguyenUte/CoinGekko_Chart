from pydantic import BaseModel
from typing import List

class DPOResponse(BaseModel):
    coin: str
    indicator_config: str
    date: List[str]
    value: List[float]
