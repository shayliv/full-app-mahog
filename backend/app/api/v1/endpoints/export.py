import csv
import io
from typing import Optional

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.student import Student as StudentModel
from app.services.alerts import (
    get_student_average_grade,
    get_student_discipline_counts,
    student_has_active_medical_issue,
)


router = APIRouter()


@router.get("/students.csv")
def export_students_csv(
    db: Session = Depends(get_db),
    track: Optional[str] = None,
    class_name: Optional[str] = None,
    commander_name: Optional[str] = None,
) -> Response:
    query = db.query(StudentModel).filter(StudentModel.deleted_at.is_(None))
    if track:
        query = query.filter(StudentModel.track == track)
    if class_name:
        query = query.filter(StudentModel.class_name == class_name)
    if commander_name:
        query = query.filter(StudentModel.commander_name == commander_name)

    students = query.all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)

    writer.writerow(
        [
            "id",
            "full_name",
            "id_number",
            "course_name",
            "track",
            "class_name",
            "commander_name",
            "status",
            "discipline_count",
            "average_grade",
            "has_active_medical_issue",
        ]
    )

    for s in students:
        total, _ = get_student_discipline_counts(db, s.id)
        avg = get_student_average_grade(db, s.id)
        has_medical = student_has_active_medical_issue(db, s.id)
        writer.writerow(
            [
                s.id,
                s.full_name,
                s.id_number,
                s.course_name,
                s.track,
                s.class_name,
                s.commander_name,
                s.status.value if hasattr(s.status, "value") else s.status,
                total,
                avg if avg is not None else "",
                "yes" if has_medical else "no",
            ]
        )

    csv_data = buffer.getvalue()
    buffer.close()

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="students.csv"'},
    )

