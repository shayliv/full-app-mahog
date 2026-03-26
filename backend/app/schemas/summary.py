from datetime import date
from typing import Optional

from pydantic import BaseModel


class CommandSummaryBase(BaseModel):
    commander_name: str
    date: date
    text: str
    attachment_path: Optional[str] = None


class CommandSummaryCreate(CommandSummaryBase):
    pass


class CommandSummaryUpdate(BaseModel):
    commander_name: Optional[str] = None
    date: Optional[date] = None
    text: Optional[str] = None
    attachment_path: Optional[str] = None


class CommandSummary(CommandSummaryBase):
    id: int

    class Config:
        from_attributes = True

