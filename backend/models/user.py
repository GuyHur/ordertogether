"""User ORM model."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, TimestampMixin, UUIDMixin


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    auth_source: Mapped[str] = mapped_column(String(20), nullable=False, default="local")
    building: Mapped[str | None] = mapped_column(String(100), nullable=True)
    avatar_color: Mapped[str | None] = mapped_column(String(7), nullable=True)

    # Relationships
    created_orders = relationship("Order", back_populates="creator", lazy="selectin")
    participations = relationship("OrderParticipant", back_populates="user", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User {self.email}>"
