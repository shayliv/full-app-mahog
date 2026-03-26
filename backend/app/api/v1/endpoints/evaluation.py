from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.evaluation import Exercise as ExerciseModel
from app.models.evaluation import Test as TestModel
from app.schemas import (
    Exercise,
    ExerciseCreate,
    ExerciseUpdate,
    GradeStats,
    Test,
    TestCreate,
    TestUpdate,
)


router = APIRouter()


@router.get("/tests", response_model=List[Test])
def list_tests(student_id: int, db: Session = Depends(get_db)) -> List[Test]:
    tests = (
        db.query(TestModel)
        .filter(TestModel.student_id == student_id)
        .order_by(TestModel.date)
        .all()
    )
    return [Test.from_orm(t) for t in tests]


@router.post("/tests", response_model=Test, status_code=status.HTTP_201_CREATED)
def create_test(
    student_id: int, test_in: TestCreate, db: Session = Depends(get_db)
) -> Test:
    test = TestModel(student_id=student_id, **test_in.model_dump())
    db.add(test)
    db.commit()
    db.refresh(test)
    return Test.from_orm(test)


@router.put("/tests/{test_id}", response_model=Test)
def update_test(
    student_id: int, test_id: int, test_in: TestUpdate, db: Session = Depends(get_db)
) -> Test:
    test = (
        db.query(TestModel)
        .filter(TestModel.id == test_id, TestModel.student_id == student_id)
        .first()
    )
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    for field, value in test_in.model_dump(exclude_unset=True).items():
        setattr(test, field, value)

    db.add(test)
    db.commit()
    db.refresh(test)
    return Test.from_orm(test)


@router.delete("/tests/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test(student_id: int, test_id: int, db: Session = Depends(get_db)) -> None:
    test = (
        db.query(TestModel)
        .filter(TestModel.id == test_id, TestModel.student_id == student_id)
        .first()
    )
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    db.delete(test)
    db.commit()


@router.get("/tests/stats", response_model=GradeStats)
def get_grade_stats(student_id: int, db: Session = Depends(get_db)) -> GradeStats:
    tests = (
        db.query(TestModel)
        .filter(TestModel.student_id == student_id)
        .order_by(TestModel.date)
        .all()
    )
    if not tests:
        return GradeStats(average=None, trend_points=[])
    avg = sum(t.grade for t in tests) / len(tests)
    return GradeStats(average=avg, trend_points=[Test.from_orm(t) for t in tests])


@router.get("/exercises", response_model=List[Exercise])
def list_exercises(student_id: int, db: Session = Depends(get_db)) -> List[Exercise]:
    exercises = (
        db.query(ExerciseModel)
        .filter(ExerciseModel.student_id == student_id)
        .order_by(ExerciseModel.id.desc())
        .all()
    )
    return [Exercise.from_orm(e) for e in exercises]


@router.post("/exercises", response_model=Exercise, status_code=status.HTTP_201_CREATED)
def create_exercise(
    student_id: int, exercise_in: ExerciseCreate, db: Session = Depends(get_db)
) -> Exercise:
    exercise = ExerciseModel(student_id=student_id, **exercise_in.model_dump())
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return Exercise.from_orm(exercise)


@router.put("/exercises/{exercise_id}", response_model=Exercise)
def update_exercise(
    student_id: int,
    exercise_id: int,
    exercise_in: ExerciseUpdate,
    db: Session = Depends(get_db),
) -> Exercise:
    exercise = (
        db.query(ExerciseModel)
        .filter(ExerciseModel.id == exercise_id, ExerciseModel.student_id == student_id)
        .first()
    )
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    for field, value in exercise_in.model_dump(exclude_unset=True).items():
        setattr(exercise, field, value)

    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return Exercise.from_orm(exercise)


@router.delete("/exercises/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise(
    student_id: int, exercise_id: int, db: Session = Depends(get_db)
) -> None:
    exercise = (
        db.query(ExerciseModel)
        .filter(ExerciseModel.id == exercise_id, ExerciseModel.student_id == student_id)
        .first()
    )
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    db.delete(exercise)
    db.commit()

