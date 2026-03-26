from datetime import datetime

from sqlalchemy import Column, DateTime, Integer
from sqlalchemy.orm import as_declarative, declared_attr


@as_declarative()
class Base:
    __allow_unmapped__ = True

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    @declared_attr
    def __tablename__(cls) -> str:  # type: ignore[override]
        return cls.__name__.lower()
