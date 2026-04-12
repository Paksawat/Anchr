from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import httpx
import bcrypt
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from stats_helpers import calculate_streak, calculate_period_data, calculate_best_streak

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ─── Pydantic Models ───

class UserRegister(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: Optional[str] = None

class SessionExchange(BaseModel):
    session_id: str

class UrgeCreate(BaseModel):
    trigger: Optional[str] = None
    emotion: Optional[str] = None
    notes: Optional[str] = None
    intensity: Optional[int] = 5

class UrgeUpdate(BaseModel):
    outcome: str  # "resisted", "relapsed"
    duration_seconds: Optional[int] = None
    coping_used: Optional[str] = None

class MotivationCreate(BaseModel):
    message: str
    category: Optional[str] = "general"

class ReminderSettings(BaseModel):
    enabled: bool = True
    times: List[str] = []
    days: List[str] = []

class RelapseCreate(BaseModel):
    trigger: Optional[str] = None
    emotion: Optional[str] = None
    notes: Optional[str] = None

# ─── Auth Helpers ───

async def get_current_user(request: Request) -> dict:
    token = None
    cookie_token = request.cookies.get("session_token")
    if cookie_token:
        token = cookie_token
    auth_header = request.headers.get("Authorization")
    if not token and auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def create_session_token():
    return f"sess_{uuid.uuid4().hex}"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def set_session_cookie(response: Response, token: str):
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 3600
    )

# ─── Auth Routes ───

@api_router.post("/auth/register")
async def register(data: UserRegister, response: Response):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    user_doc = {
        "user_id": user_id,
        "email": data.email,
        "name": data.name,
        "password_hash": hash_password(data.password),
        "picture": None,
        "created_at": now,
        "auth_provider": "email"
    }
    await db.users.insert_one(user_doc)
    token = create_session_token()
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": now
    })
    set_session_cookie(response, token)
    return {"user_id": user_id, "email": data.email, "name": data.name, "picture": None, "created_at": now}

@api_router.post("/auth/login")
async def login(data: UserLogin, response: Response):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="This account uses Google login")
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_session_token()
    now = datetime.now(timezone.utc).isoformat()
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": now
    })
    set_session_cookie(response, token)
    return {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "picture": user.get("picture"), "created_at": user.get("created_at")}

@api_router.post("/auth/session")
async def exchange_session(data: SessionExchange, response: Response):
    async with httpx.AsyncClient() as hc:
        resp = await hc.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": data.session_id}
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session ID")
    google_data = resp.json()
    user = await db.users.find_one({"email": google_data["email"]}, {"_id": 0})
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        user = {
            "user_id": user_id,
            "email": google_data["email"],
            "name": google_data.get("name", ""),
            "picture": google_data.get("picture"),
            "created_at": now,
            "auth_provider": "google"
        }
        await db.users.insert_one(user)
    else:
        user_id = user["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": google_data.get("name", user["name"]), "picture": google_data.get("picture", user.get("picture"))}})
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    token = create_session_token()
    now = datetime.now(timezone.utc).isoformat()
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": now
    })
    set_session_cookie(response, token)
    return {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "picture": user.get("picture"), "created_at": user.get("created_at")}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "picture": user.get("picture"), "created_at": user.get("created_at")}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", secure=True, samesite="none")
    return {"message": "Logged out"}

# ─── Urge Routes ───

@api_router.post("/urges")
async def create_urge(data: UrgeCreate, user: dict = Depends(get_current_user)):
    urge_id = f"urge_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    urge = {
        "urge_id": urge_id,
        "user_id": user["user_id"],
        "trigger": data.trigger,
        "emotion": data.emotion,
        "notes": data.notes,
        "intensity": data.intensity,
        "outcome": "in_progress",
        "duration_seconds": None,
        "coping_used": None,
        "hour_of_day": now.hour,
        "day_of_week": now.strftime("%A"),
        "created_at": now.isoformat()
    }
    await db.urges.insert_one(urge)
    return {k: v for k, v in urge.items() if k != "_id"}

@api_router.get("/urges")
async def get_urges(user: dict = Depends(get_current_user), limit: int = 50):
    urges = await db.urges.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return urges

@api_router.put("/urges/{urge_id}")
async def update_urge(urge_id: str, data: UrgeUpdate, user: dict = Depends(get_current_user)):
    result = await db.urges.update_one(
        {"urge_id": urge_id, "user_id": user["user_id"]},
        {"$set": {"outcome": data.outcome, "duration_seconds": data.duration_seconds, "coping_used": data.coping_used}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Urge not found")
    urge = await db.urges.find_one({"urge_id": urge_id}, {"_id": 0})
    return urge

# ─── Stats Routes ───

@api_router.get("/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    relapses = await db.relapses.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    urges = await db.urges.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)

    user_created = user.get("created_at", now.isoformat())
    streak_days = calculate_streak(relapses, user_created, now)
    urges_resisted = len([u for u in urges if u.get("outcome") == "resisted"])
    total_urges = len(urges)
    total_relapses = len(relapses)
    weekly_urges = calculate_period_data(urges, now, 7)
    monthly_urges = calculate_period_data(urges, now, 30)
    best_streak = calculate_best_streak(relapses, streak_days)

    return {
        "streak_days": streak_days,
        "best_streak": best_streak,
        "urges_resisted": urges_resisted,
        "total_urges": total_urges,
        "total_relapses": total_relapses,
        "resist_rate": round(urges_resisted / total_urges * 100) if total_urges > 0 else 0,
        "weekly": weekly_urges,
        "monthly": monthly_urges
    }

@api_router.get("/stats/triggers")
async def get_trigger_stats(user: dict = Depends(get_current_user)):
    urges = await db.urges.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    triggers = {}
    emotions = {}
    hours = {}
    for u in urges:
        t = u.get("trigger") or "Unknown"
        triggers[t] = triggers.get(t, 0) + 1
        e = u.get("emotion") or "Unknown"
        emotions[e] = emotions.get(e, 0) + 1
        h = u.get("hour_of_day", 0)
        hours[h] = hours.get(h, 0) + 1
    top_trigger = max(triggers, key=triggers.get) if triggers else None
    peak_hour = max(hours, key=hours.get) if hours else None
    return {
        "triggers": [{"name": k, "count": v} for k, v in sorted(triggers.items(), key=lambda x: -x[1])],
        "emotions": [{"name": k, "count": v} for k, v in sorted(emotions.items(), key=lambda x: -x[1])],
        "hours": [{"hour": k, "count": v} for k, v in sorted(hours.items())],
        "top_trigger": top_trigger,
        "peak_hour": peak_hour
    }

# ─── Motivation Routes ───

@api_router.post("/motivations")
async def create_motivation(data: MotivationCreate, user: dict = Depends(get_current_user)):
    mot_id = f"mot_{uuid.uuid4().hex[:12]}"
    mot = {
        "motivation_id": mot_id,
        "user_id": user["user_id"],
        "message": data.message,
        "category": data.category,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.motivations.insert_one(mot)
    return {k: v for k, v in mot.items() if k != "_id"}

@api_router.get("/motivations")
async def get_motivations(user: dict = Depends(get_current_user)):
    mots = await db.motivations.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    return mots

@api_router.delete("/motivations/{mot_id}")
async def delete_motivation(mot_id: str, user: dict = Depends(get_current_user)):
    result = await db.motivations.delete_one({"motivation_id": mot_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Motivation not found")
    return {"message": "Deleted"}

# ─── Relapse Routes ───

@api_router.post("/relapses")
async def create_relapse(data: RelapseCreate, user: dict = Depends(get_current_user)):
    rel_id = f"rel_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    rel = {
        "relapse_id": rel_id,
        "user_id": user["user_id"],
        "trigger": data.trigger,
        "emotion": data.emotion,
        "notes": data.notes,
        "created_at": now
    }
    await db.relapses.insert_one(rel)
    return {k: v for k, v in rel.items() if k != "_id"}

@api_router.get("/relapses")
async def get_relapses(user: dict = Depends(get_current_user)):
    rels = await db.relapses.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return rels

# ─── Reminder Routes ───

@api_router.get("/reminders")
async def get_reminders(user: dict = Depends(get_current_user)):
    rem = await db.reminders.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not rem:
        return {"enabled": True, "times": ["09:00", "21:00"], "days": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]}
    return rem

@api_router.put("/reminders")
async def update_reminders(data: ReminderSettings, user: dict = Depends(get_current_user)):
    await db.reminders.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"enabled": data.enabled, "times": data.times, "days": data.days, "user_id": user["user_id"]}},
        upsert=True
    )
    return {"enabled": data.enabled, "times": data.times, "days": data.days}

# ─── App Setup ───

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
