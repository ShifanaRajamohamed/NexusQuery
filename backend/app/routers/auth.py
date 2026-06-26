from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, AuditLog
from app.schemas import UserRegister, UserLogin, Token, UserOut, PasswordReset
from app.auth import get_password_hash, verify_password, create_access_token, create_refresh_token, get_current_active_user
from app.config import ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if email exists
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username exists
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_pw = get_password_hash(user_in.password)
    user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_pw,
        role=user_in.role,
        department=user_in.department
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Log action
    log = AuditLog(user_id=user.id, action="USER_REGISTER", details=f"Registered username {user.username}")
    db.add(log)
    db.commit()

    return user

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == login_in.username_or_email) | 
        (User.email == login_in.username_or_email)
    ).first()

    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    # Generate JWT
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # Log login
    log = AuditLog(user_id=user.id, action="USER_LOGIN", details=f"Logged in from API")
    db.add(log)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    from jose import jwt, JWTError
    from app.config import SECRET_KEY, ALGORITHM
    
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        token_type = payload.get("type")
        if not user_id or token_type != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    new_access = create_access_token(data={"sub": str(user.id), "role": user.role})
    new_refresh = create_refresh_token(data={"sub": str(user.id)})

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer"
    }

@router.post("/reset-password")
def reset_password(reset_in: PasswordReset, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == reset_in.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email not found")

    user.hashed_password = get_password_hash(reset_in.new_password)
    db.commit()

    log = AuditLog(user_id=user.id, action="PASSWORD_RESET", details="Reset password")
    db.add(log)
    db.commit()

    return {"message": "Password updated successfully"}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user
