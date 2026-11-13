
from pydantic import BaseModel, Field


# Signup request
class SignupRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    organization_name: str = Field(min_length=2, max_length=150)


# Login request
class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)


# JWT response
class TokenResponse(BaseModel):
    access_token: str
    token_type: str


from datetime import datetime
from decimal import Decimal
from pydantic import ConfigDict


# Create Product
class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    sku: str = Field(min_length=1, max_length=100)
    description: str | None = None
    quantity: int = Field(ge=0)
    cost_price: Decimal | None = Field(default=None, ge=0)
    selling_price: Decimal | None = Field(default=None, ge=0)
    low_stock_threshold: int | None = Field(default=None, ge=0)


# Update Product
class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    sku: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    quantity: int | None = Field(default=None, ge=0)
    cost_price: Decimal | None = Field(default=None, ge=0)
    selling_price: Decimal | None = Field(default=None, ge=0)
    low_stock_threshold: int | None = Field(default=None, ge=0)


# Product Response
class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    name: str
    sku: str
    description: str | None
    quantity: int
    cost_price: Decimal | None
    selling_price: Decimal | None
    low_stock_threshold: int | None
    created_at: datetime
    updated_at: datetime | None
