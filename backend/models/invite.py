"""InviteLink ORM model — single-use or multi-use invite tokens for orders."""

import secrets

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, TimestampMixin, UUIDMixin


def _generate_token() -> str:
    """Generate a URL-safe invite token (12 chars)."""
    return secrets.token_urlsafe(9)  # 12 base64 chars


class InviteLink(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "invite_links"

    order_id: Mapped[str] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    token: Mapped[str] = mapped_column(
        String(24), unique=True, nullable=False, default=_generate_token, index=True
    )
    max_uses: Mapped[int | None] = mapped_column(Integer, nullable=True)  # null = unlimited
    use_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="invite_links", lazy="selectin")

    @property
    def is_valid(self) -> bool:
        """Check if this invite is still usable."""
        if not self.is_active:
            return False
        if self.max_uses is not None and self.use_count >= self.max_uses:
            return False
        return True

    def __repr__(self) -> str:
        return f"<InviteLink {self.token} order={self.order_id} uses={self.use_count}/{self.max_uses}>"
