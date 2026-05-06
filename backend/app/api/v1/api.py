from fastapi import APIRouter

from app.api.v1.endpoints import (
    students,
    commanders,
    departments,
    discipline,
    evaluation,
    medical,
    summaries,
    dashboard,
    export,
    views,
    analytics,
    attachments,
    bakatzim,
)


api_router = APIRouter()

api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(commanders.router, prefix="/commanders", tags=["commanders"])
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])
api_router.include_router(views.router, prefix="/views", tags=["views"])
api_router.include_router(
    discipline.router, prefix="/students/{student_id}/discipline", tags=["discipline"]
)
api_router.include_router(
    evaluation.router, prefix="/students/{student_id}/evaluation", tags=["evaluation"]
)
api_router.include_router(
    medical.router, prefix="/students/{student_id}/medical", tags=["medical"]
)
api_router.include_router(
    summaries.router, prefix="/students/{student_id}/summaries", tags=["summaries"]
)
api_router.include_router(
    bakatzim.router, prefix="/students/{student_id}/bakatzim", tags=["bakatzim"]
)
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(export.router, prefix="/export", tags=["export"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(attachments.router, prefix="/attachments", tags=["attachments"])

