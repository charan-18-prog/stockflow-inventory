
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    Numeric,
    DateTime,
    UniqueConstraint,
    func
)

from database import Base


# 1. Organization Table
class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


# 2. User Table
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


# 3. Product Table
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    organization_id = Column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    name = Column(String(150), nullable=False)
    sku = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    quantity = Column(Integer, nullable=False, default=0)
    cost_price = Column(Numeric(10, 2), nullable=True)
    selling_price = Column(Numeric(10, 2), nullable=True)
    low_stock_threshold = Column(Integer, nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "sku",
            name="unique_sku_per_organization"
        ),
    )
# 4. Organization Settings Table
class OrganizationSetting(Base):
    __tablename__ = "organization_settings"

    id = Column(Integer, primary_key=True, index=True)

    organization_id = Column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    default_low_stock_threshold = Column(
        Integer,
        nullable=False,
        default=5
    )