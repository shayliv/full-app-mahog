from datetime import date
from typing import List, Optional

from pydantic import BaseModel


class TestBase(BaseModel):
    name: str
    date: date
    grade: float


class TestCreate(TestBase):
    pass


class TestUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[date] = None
    grade: Optional[float] = None


class Test(TestBase):
    id: int

    class Config:
        from_attributes = True


class ExerciseBase(BaseModel):
    description: str
    attachment_path: Optional[str] = None


class ExerciseCreate(ExerciseBase):
    pass


class ExerciseUpdate(BaseModel):
    description: Optional[str] = None
    attachment_path: Optional[str] = None


class Exercise(ExerciseBase):
    id: int

    class Config:
        from_attributes = True


class GradeStats(BaseModel):
    average: Optional[float] = None
    trend_points: List[Test] = []

