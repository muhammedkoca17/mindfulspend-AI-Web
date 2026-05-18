from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    monthly_income: float = Field(default=0.0, ge=0)
    budget_goal: float = Field(default=0.0, ge=0)
    financial_scenario: str = Field(default="normal")


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    monthly_income: float
    budget_goal: float
    financial_scenario: str
    created_at: datetime
