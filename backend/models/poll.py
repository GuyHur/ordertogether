import uuid
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, UUIDMixin, TimestampMixin

class Poll(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "polls"

    creator_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    building: Mapped[str | None] = mapped_column(String(100), nullable=True)
    destination: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    
    creator = relationship("User", lazy="selectin")
    options = relationship("PollOption", back_populates="poll", lazy="selectin", cascade="all, delete-orphan")
    votes = relationship("PollVote", back_populates="poll", lazy="selectin", cascade="all, delete-orphan")


class PollOption(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "poll_options"

    poll_id: Mapped[str] = mapped_column(ForeignKey("polls.id", ondelete="CASCADE"), nullable=False)
    service_id: Mapped[str | None] = mapped_column(ForeignKey("delivery_services.id"), nullable=True)
    text: Mapped[str | None] = mapped_column(String(200), nullable=True)

    poll = relationship("Poll", back_populates="options")
    service = relationship("DeliveryService", lazy="selectin")


class PollVote(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "poll_votes"

    poll_id: Mapped[str] = mapped_column(ForeignKey("polls.id", ondelete="CASCADE"), nullable=False)
    option_id: Mapped[str] = mapped_column(ForeignKey("poll_options.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    poll = relationship("Poll", back_populates="votes")
    user = relationship("User", lazy="selectin")
