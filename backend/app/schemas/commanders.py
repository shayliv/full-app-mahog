from typing import List, Optional

from pydantic import BaseModel


class CommanderListItem(BaseModel):
    id: int
    full_name: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
