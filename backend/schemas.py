
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
