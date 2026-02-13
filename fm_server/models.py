from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from typing_extensions import Optional

from .database import engine


class Base(DeclarativeBase):
    pass


class Music(Base):
    __tablename__ = "music"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    file_path: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    artist: Mapped[str] = mapped_column(String, default="Unknown")
    rating: Mapped[int] = mapped_column(Integer, default=0)
    play_count: Mapped[int] = mapped_column(Integer, default=0)
    last_played: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)


def init_db():
    Base.metadata.create_all(bind=engine)
