"""Authentication endpoints: register, login, me.

JWT-based session with bcrypt password hashing.
"""
from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.db.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def create_access_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": str(user_id), "exp": expire},
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Dependency: extract and validate current user from JWT."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Oturum gecersiz veya suresi dolmus",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if token is None:
        raise credentials_exception
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = int(payload.get("sub"))
    except (JWTError, ValueError, TypeError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise credentials_exception
    return user


def _user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "monthly_salary": user.monthly_salary,
        "onboarding_completed": user.onboarding_completed,
        "risk_profile": user.risk_profile,
        "age": user.age,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user with email and password."""
    # 30 kullanıcı sınırı kontrolü
    user_count = db.query(User).count()
    if user_count >= 30:
        raise HTTPException(status_code=400, detail="Maksimum kullanıcı kayıt sınırına (30) ulaşıldı.")

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Bu email adresi zaten kayitli")

    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Sifre en az 8 karakter olmalidir")

    try:
        user = User(
            email=data.email,
            hashed_password=pwd_context.hash(data.password),
            full_name=data.full_name,
            onboarding_completed=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        # Veritabanı hatası vb. olursa hatayı döndür
        raise HTTPException(status_code=500, detail=f"Sunucu hatası: {str(e)}")

    return TokenResponse(
        access_token=create_access_token(user.id),
        user=_user_to_dict(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password, returns JWT token."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not pwd_context.verify(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email veya sifre hatali")

    return TokenResponse(
        access_token=create_access_token(user.id),
        user=_user_to_dict(user),
    )


@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user's profile."""
    return _user_to_dict(user)


class UserUpdate(BaseModel):
    monthly_salary: float | None = None
    full_name: str | None = None
    risk_profile: str | None = None
    age: int | None = None

@router.patch("/me")
def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update current user's profile (salary, name, risk_profile, age)."""
    if data.monthly_salary is not None:
        user.monthly_salary = data.monthly_salary
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.risk_profile is not None:
        user.risk_profile = data.risk_profile
    if data.age is not None:
        user.age = data.age
    db.commit()
    db.refresh(user)
    # Update localStorage mirror
    return _user_to_dict(user)
