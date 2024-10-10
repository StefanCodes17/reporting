from fastapi import FastAPI, Depends, HTTPException, status, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from core.config import config
from .models import User, Base, ReportLayout
from .database import engine, get_db
from core.auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from .controllers.UserController import get_current_user
from datetime import timedelta
from typing import List
import json
from pydantic import BaseModel


app = FastAPI(
    title="FastAPI App",
    description="A simple FastAPI application",
    version="1.0.0",
    debug=config.DEBUG
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

Base.metadata.create_all(bind=engine)

class UserRegistration(BaseModel):
    username: str
    password: str

class SectionModel(BaseModel):
    name: str
    position: str
    content: str

class ReportLayoutModel(BaseModel):
    name: str
    sections: List[SectionModel]

@app.get("/")
async def root():
    return {"message": "Welcome to the FastAPI App"}
# Register user
@app.post("/register/")
def register(user_data: UserRegistration = Body(...), db: Session = Depends(get_db)):
    hashed_password = get_password_hash(user_data.password)
    user = User(username=user_data.username, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"username": user.username, "message": "User registered successfully"}

# Login and get token
@app.post("/token")
def login_for_access_token(user_data: UserRegistration = Body(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.username}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

# Get current authenticated user
@app.get("/users/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {"username": current_user.username}

@app.get("/report-layout/{layout_id}")
def get_layout(layout_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_layout = db.query(ReportLayout).filter(
        ReportLayout.id == layout_id,
        ReportLayout.user_id == current_user.id
    ).first()
    
    if not db_layout:
        raise HTTPException(status_code=404, detail="Layout not found for this user")
    
    # Convert the database model to a dictionary
    layout_data = {
        "name": db_layout.name,
        "sections": db_layout.sections
    }
    
    # Return the layout data as JSON
    return {"user": current_user.username, "layout": db_layout.layout_data}

@app.get("/report-layout")
def get_layout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_layout = db.query(ReportLayout).filter(ReportLayout.user_id == current_user.id).first()
    
    if not db_layout:
        raise HTTPException(status_code=404, detail="Layout not found for this user")
    
    # Convert the database model to a dictionary
    layout_data = {
        "name": db_layout.report_name,
        "sections": json.loads(db_layout.layout_data)
    }
    
    # Return the layout data as JSON
    return {"user": current_user.username, "layout": layout_data}


@app.post("/report-layout/{report_layout_id}")
def edit_report_layout(
    report_layout_id,
    layout: ReportLayoutModel = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)):
    
    db_layout = db.query(ReportLayout).filter(ReportLayout.user_id == current_user.id, ReportLayout.id == report_layout_id).first()
    db_layout.layout_data = json.dumps([section.dict() for section in layout.sections])

    db.commit()
    db.refresh(db_layout)

    return {"message": "Report layout edit successfully", "layout_id": db_layout.id}

@app.post("/report-layout")
def create_report_layout(
    layout: ReportLayoutModel = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_layout = ReportLayout(
        report_name=layout.name,
        user_id=current_user.id,
        layout_data=json.dumps([section.dict() for section in layout.sections])
    )
    
    db.add(db_layout)
    db.commit()
    db.refresh(db_layout)
    
    return {"message": "Report layout created successfully", "layout_id": db_layout.id}

