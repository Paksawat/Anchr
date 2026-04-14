from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from urllib.parse import urlparse
from collections import defaultdict, deque
import os
import time
import logging
import uuid
import httpx
import bcrypt
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from stats_helpers import calculate_streak, calculate_period_data, calculate_best_streak, calculate_yearly_data
from programs_data import PROGRAMS, PRESET_URGE_TYPES, PRESET_HABITS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ─── Models ───

class UserRegister(BaseModel):
    email: EmailStr                  # validated email format
    password: str
    name: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        # Enforce minimum password length server-side — never trust client validation alone
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

class UserLogin(BaseModel):
    email: EmailStr                  # validated email format
    password: str

class UrgeCreate(BaseModel):
    trigger: Optional[str] = None
    emotion: Optional[str] = None
    notes: Optional[str] = None
    intensity: Optional[int] = 5
    urge_type: Optional[str] = None
    custom_urge_type: Optional[str] = None

class UrgeUpdate(BaseModel):
    outcome: str
    duration_seconds: Optional[int] = None
    coping_used: Optional[str] = None

class MotivationCreate(BaseModel):
    message: str
    category: Optional[str] = "general"

class ReminderSettings(BaseModel):
    enabled: bool = True
    # Field(default_factory=list) prevents shared mutable default across instances
    times: List[str] = Field(default_factory=list)
    days: List[str] = Field(default_factory=list)

class RelapseCreate(BaseModel):
    trigger: Optional[str] = None
    emotion: Optional[str] = None
    notes: Optional[str] = None

class ProfileUpdate(BaseModel):
    urge_type: Optional[str] = None
    custom_urge_type: Optional[str] = None
    # `tier` intentionally omitted — privilege field, only settable server-side (billing/admin)
    disclaimer_accepted: Optional[bool] = None

class HabitCreate(BaseModel):
    name: str
    icon: Optional[str] = "check"
    category: Optional[str] = "custom"
    habit_id: Optional[str] = None

class HabitToggle(BaseModel):
    date: str

class BuddyCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    relationship: Optional[str] = None

class ProgramEnroll(BaseModel):
    program_id: str

class DayComplete(BaseModel):
    day: int
    reflection: Optional[str] = None

# ─── Rate Limiting ───
# Simple in-memory sliding-window limiter.
# Works for single-instance Render deployments.
# For multi-instance: replace with Redis-backed slowapi.

_rl_store: dict = defaultdict(deque)

def _check_rate_limit(key: str, limit: int, window_seconds: int) -> None:
    """Raise 429 if `key` exceeds `limit` calls within `window_seconds`."""
    now = time.monotonic()
    bucket = _rl_store[key]
    while bucket and bucket[0] < now - window_seconds:
        bucket.popleft()
    if len(bucket) >= limit:
        raise HTTPException(status_code=429, detail="Too many attempts. Please try again later.")
    bucket.append(now)

# ─── Auth Helpers ───

def _extract_token(request: Request) -> str:
    cookie_token = request.cookies.get("session_token")
    if cookie_token:
        return cookie_token
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ")[1]
    return None

async def _validate_session(token: str) -> dict:
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
    return session

async def log_audit(user_id: str, action: str, request: Request = None):
    """Log major user actions. Never log personal content."""
    ip = None
    if request:
        forwarded = request.headers.get("x-forwarded-for")
        ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else None)
    await db.audit_logs.insert_one({
        "user_id": user_id,
        "action": action,
        "ip": ip,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

async def get_current_user(request: Request) -> dict:
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await _validate_session(token)
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
    response.set_cookie(key="session_token", value=token, httponly=True, secure=True, samesite="none", path="/", max_age=7*24*3600)

# ─── Auth Routes ───

@api_router.post("/auth/register")
async def register(data: UserRegister, request: Request, response: Response):
    # Rate limit: 5 registrations per IP per minute
    client_ip = (request.headers.get("x-forwarded-for", "") or "").split(",")[0].strip() or (request.client.host if request.client else "unknown")
    _check_rate_limit(f"register:{client_ip}", limit=5, window_seconds=60)

    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    user_doc = {"user_id": user_id, "email": data.email, "name": data.name, "password_hash": hash_password(data.password), "picture": None, "created_at": now, "auth_provider": "email", "urge_type": None, "custom_urge_type": None, "tier": "free", "disclaimer_accepted": False}
    await db.users.insert_one(user_doc)
    token = create_session_token()
    await db.user_sessions.insert_one({"user_id": user_id, "session_token": token, "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(), "created_at": now})
    set_session_cookie(response, token)
    await log_audit(user_id, "register", request)
    return {"user_id": user_id, "email": data.email, "name": data.name, "picture": None, "created_at": now, "urge_type": None, "custom_urge_type": None, "tier": "free", "disclaimer_accepted": False}

@api_router.post("/auth/login")
async def login(data: UserLogin, request: Request, response: Response):
    # Rate limit: 10 login attempts per IP per minute
    client_ip = (request.headers.get("x-forwarded-for", "") or "").split(",")[0].strip() or (request.client.host if request.client else "unknown")
    _check_rate_limit(f"login:{client_ip}", limit=10, window_seconds=60)

    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="This account uses Google login")
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_session_token()
    now = datetime.now(timezone.utc).isoformat()
    await db.user_sessions.insert_one({"user_id": user["user_id"], "session_token": token, "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(), "created_at": now})
    set_session_cookie(response, token)
    await log_audit(user["user_id"], "login", request)
    return {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "picture": user.get("picture"), "created_at": user.get("created_at"), "urge_type": user.get("urge_type"), "custom_urge_type": user.get("custom_urge_type"), "tier": user.get("tier", "free"), "disclaimer_accepted": user.get("disclaimer_accepted", True)}


@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "picture": user.get("picture"), "created_at": user.get("created_at"), "urge_type": user.get("urge_type"), "custom_urge_type": user.get("custom_urge_type"), "tier": user.get("tier", "free"), "disclaimer_accepted": user.get("disclaimer_accepted", True)}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if session:
            await log_audit(session["user_id"], "logout", request)
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", secure=True, samesite="none")
    return {"message": "Logged out"}

# ─── Profile ───

@api_router.put("/profile")
async def update_profile(data: ProfileUpdate, user: dict = Depends(get_current_user)):
    updates = {}
    if data.urge_type is not None:
        updates["urge_type"] = data.urge_type
    if data.custom_urge_type is not None:
        updates["custom_urge_type"] = data.custom_urge_type
    # `tier` is NOT updated here — privilege escalation prevention.
    # Tier changes must go through billing/admin endpoints only.
    if data.disclaimer_accepted is not None:
        updates["disclaimer_accepted"] = data.disclaimer_accepted
    if updates:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": updates})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {"user_id": updated["user_id"], "email": updated["email"], "name": updated["name"], "picture": updated.get("picture"), "urge_type": updated.get("urge_type"), "custom_urge_type": updated.get("custom_urge_type"), "tier": updated.get("tier", "free"), "disclaimer_accepted": updated.get("disclaimer_accepted", True)}

@api_router.get("/urge-types")
async def get_urge_types():
    return PRESET_URGE_TYPES

# ─── Urge Routes ───

@api_router.post("/urges")
async def create_urge(data: UrgeCreate, user: dict = Depends(get_current_user)):
    urge_id = f"urge_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    # Default urge_type to user's profile urge_type if not provided
    urge_type = data.urge_type or user.get("urge_type")
    custom_urge_type = data.custom_urge_type or (user.get("custom_urge_type") if urge_type == "other" else None)
    urge = {"urge_id": urge_id, "user_id": user["user_id"], "trigger": data.trigger, "emotion": data.emotion, "notes": data.notes, "intensity": data.intensity, "outcome": "in_progress", "duration_seconds": None, "coping_used": None, "urge_type": urge_type, "custom_urge_type": custom_urge_type, "hour_of_day": now.hour, "day_of_week": now.strftime("%A"), "created_at": now.isoformat()}
    await db.urges.insert_one(urge)
    return {k: v for k, v in urge.items() if k != "_id"}

@api_router.get("/urges")
async def get_urges(user: dict = Depends(get_current_user), limit: int = 50):
    return await db.urges.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(limit)

@api_router.put("/urges/{urge_id}")
async def update_urge(urge_id: str, data: UrgeUpdate, user: dict = Depends(get_current_user)):
    result = await db.urges.update_one({"urge_id": urge_id, "user_id": user["user_id"]}, {"$set": {"outcome": data.outcome, "duration_seconds": data.duration_seconds, "coping_used": data.coping_used}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Urge not found")
    return await db.urges.find_one({"urge_id": urge_id}, {"_id": 0})

# ─── Stats ───

@api_router.get("/stats")
async def get_stats(user: dict = Depends(get_current_user), urge_type: Optional[str] = None):
    now = datetime.now(timezone.utc)
    relapses = await db.relapses.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    urge_query = {"user_id": user["user_id"]}
    if urge_type:
        urge_query["urge_type"] = urge_type
    urges = await db.urges.find(urge_query, {"_id": 0}).to_list(1000)
    user_created = user.get("created_at", now.isoformat())
    streak_days = calculate_streak(relapses, user_created, now)
    urges_resisted = len([u for u in urges if u.get("outcome") == "resisted"])
    total_urges = len(urges)
    return {"streak_days": streak_days, "best_streak": calculate_best_streak(relapses, streak_days), "urges_resisted": urges_resisted, "total_urges": total_urges, "total_relapses": len(relapses), "resist_rate": round(urges_resisted / total_urges * 100) if total_urges > 0 else 0, "weekly": calculate_period_data(urges, now, 7), "monthly": calculate_period_data(urges, now, 30), "yearly": calculate_yearly_data(urges, now)}

@api_router.get("/stats/triggers")
async def get_trigger_stats(user: dict = Depends(get_current_user), urge_type: Optional[str] = None):
    urge_query = {"user_id": user["user_id"]}
    if urge_type:
        urge_query["urge_type"] = urge_type
    urges = await db.urges.find(urge_query, {"_id": 0}).to_list(1000)
    triggers, emotions, hours, days = {}, {}, {}, {}
    for u in urges:
        t = u.get("trigger") or "Unknown"
        triggers[t] = triggers.get(t, 0) + 1
        e = u.get("emotion") or "Unknown"
        emotions[e] = emotions.get(e, 0) + 1
        h = u.get("hour_of_day", 0)
        hours[h] = hours.get(h, 0) + 1
        try:
            weekday = datetime.fromisoformat(u["created_at"].replace("Z", "+00:00")).weekday()
            days[weekday] = days.get(weekday, 0) + 1
        except Exception:
            pass
    # Fill missing hours 0-23 and days 0-6 with zero so chart is continuous
    all_hours = {h: hours.get(h, 0) for h in range(24)}
    all_days = {d: days.get(d, 0) for d in range(7)}
    return {
        "triggers": [{"name": k, "count": v} for k, v in sorted(triggers.items(), key=lambda x: -x[1])],
        "emotions": [{"name": k, "count": v} for k, v in sorted(emotions.items(), key=lambda x: -x[1])],
        "hours": [{"hour": k, "count": v} for k, v in sorted(all_hours.items())],
        "days": [{"day": k, "count": v} for k, v in sorted(all_days.items())],
        "top_trigger": max(triggers, key=triggers.get) if triggers else None,
        "peak_hour": max(hours, key=hours.get) if hours else None,
        "peak_day": max(days, key=days.get) if days else None,
    }

# ─── Anti-Relapse Insights (rule-based) ───

@api_router.get("/insights")
async def get_insights(user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    urges = await db.urges.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    habits_completed = await db.habit_completions.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    insights = []
    # Peak hour warning
    hours = {}
    for u in urges:
        h = u.get("hour_of_day", 0)
        hours[h] = hours.get(h, 0) + 1
    if hours:
        peak = max(hours, key=hours.get)
        current_hour = now.hour
        if abs(current_hour - peak) <= 2:
            insights.append({"type": "warning", "key": "insight_high_risk_time", "values": {}, "title": "High-risk time approaching", "message": "You usually feel urges around this time. Stay prepared.", "action": "Use the urge timer or breathing exercise"})
    # Top trigger insight
    triggers = {}
    for u in urges:
        t = u.get("trigger")
        if t:
            triggers[t] = triggers.get(t, 0) + 1
    if triggers:
        top = max(triggers, key=triggers.get)
        insights.append({"type": "insight", "key": "insight_top_trigger", "values": {"trigger": top, "count": triggers[top]}, "title": f"{top} is your #1 trigger", "message": f"{top} has triggered {triggers[top]} urges. Build specific defenses for this.", "action": "Create an if-then plan for this trigger"})
    # Habit correlation
    if habits_completed and urges:
        habit_dates = set(h.get("date") for h in habits_completed)
        urge_dates_with_habits = len([u for u in urges if u["created_at"][:10] in habit_dates])
        urge_dates_without = len(urges) - urge_dates_with_habits
        if len(habit_dates) > 3 and urge_dates_without > urge_dates_with_habits:
            reduction = round((1 - urge_dates_with_habits / max(urge_dates_without, 1)) * 100)
            if reduction > 0:
                insights.append({"type": "positive", "key": "insight_habits_working", "values": {"reduction": reduction}, "title": "Habits are working", "message": f"On days you complete habits, you have {reduction}% fewer urges.", "action": "Keep your habit streak going"})
    # Evening warning
    evening_urges = len([u for u in urges if u.get("hour_of_day", 0) >= 20])
    if evening_urges > len(urges) * 0.4 and len(urges) > 5:
        insights.append({"type": "suggestion", "key": "insight_evening_pattern", "values": {}, "title": "Evening pattern detected", "message": "Most of your urges happen after 8pm. An evening routine could help.", "action": "Try the Night Control Program"})
    # Stress pattern
    stress_urges = len([u for u in urges if u.get("trigger") == "Stress" or u.get("emotion") == "Anxious"])
    if stress_urges > len(urges) * 0.3 and len(urges) > 5:
        insights.append({"type": "suggestion", "key": "insight_stress_factor", "values": {}, "title": "Stress is a major factor", "message": "Stress and anxiety trigger many of your urges. Add stress-relief habits.", "action": "Add breathing or meditation to your daily habits"})
    return insights

# ─── Motivations ───

@api_router.post("/motivations")
async def create_motivation(data: MotivationCreate, user: dict = Depends(get_current_user)):
    mot_id = f"mot_{uuid.uuid4().hex[:12]}"
    mot = {"motivation_id": mot_id, "user_id": user["user_id"], "message": data.message, "category": data.category, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.motivations.insert_one(mot)
    return {k: v for k, v in mot.items() if k != "_id"}

@api_router.get("/motivations")
async def get_motivations(user: dict = Depends(get_current_user)):
    return await db.motivations.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)

@api_router.delete("/motivations/{mot_id}")
async def delete_motivation(mot_id: str, user: dict = Depends(get_current_user)):
    result = await db.motivations.delete_one({"motivation_id": mot_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}

# ─── Relapses ───

@api_router.post("/relapses")
async def create_relapse(data: RelapseCreate, user: dict = Depends(get_current_user)):
    rel_id = f"rel_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    rel = {"relapse_id": rel_id, "user_id": user["user_id"], "trigger": data.trigger, "emotion": data.emotion, "notes": data.notes, "created_at": now}
    await db.relapses.insert_one(rel)
    return {k: v for k, v in rel.items() if k != "_id"}

@api_router.get("/relapses")
async def get_relapses(user: dict = Depends(get_current_user)):
    return await db.relapses.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)

# ─── Reminders ───

@api_router.get("/reminders")
async def get_reminders(user: dict = Depends(get_current_user)):
    rem = await db.reminders.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not rem:
        return {"enabled": True, "times": ["09:00", "21:00"], "days": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]}
    return rem

@api_router.put("/reminders")
async def update_reminders(data: ReminderSettings, user: dict = Depends(get_current_user)):
    await db.reminders.update_one({"user_id": user["user_id"]}, {"$set": {"enabled": data.enabled, "times": data.times, "days": data.days, "user_id": user["user_id"]}}, upsert=True)
    return {"enabled": data.enabled, "times": data.times, "days": data.days}

# ─── Programs ───

@api_router.get("/programs")
async def get_programs(user: dict = Depends(get_current_user)):
    enrolled = await db.program_enrollments.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    enrolled_map = {e["program_id"]: e for e in enrolled}
    result = []
    for p in PROGRAMS:
        prog = {"program_id": p["program_id"], "title": p["title"], "description": p["description"], "duration_days": p["duration_days"], "category": p["category"], "icon": p["icon"]}
        enrollment = enrolled_map.get(p["program_id"])
        if enrollment:
            prog["enrolled"] = True
            prog["completed_days"] = enrollment.get("completed_days", [])
            prog["started_at"] = enrollment.get("started_at")
        else:
            prog["enrolled"] = False
            prog["completed_days"] = []
        result.append(prog)
    return result

@api_router.get("/programs/{program_id}")
async def get_program_detail(program_id: str, user: dict = Depends(get_current_user)):
    prog = next((p for p in PROGRAMS if p["program_id"] == program_id), None)
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found")
    enrollment = await db.program_enrollments.find_one({"user_id": user["user_id"], "program_id": program_id}, {"_id": 0})
    return {"program_id": prog["program_id"], "title": prog["title"], "description": prog["description"], "duration_days": prog["duration_days"], "category": prog["category"], "icon": prog["icon"], "days": prog["days"], "enrolled": bool(enrollment), "completed_days": enrollment.get("completed_days", []) if enrollment else [], "reflections": enrollment.get("reflections", {}) if enrollment else {}}

@api_router.post("/programs/{program_id}/enroll")
async def enroll_program(program_id: str, user: dict = Depends(get_current_user)):
    prog = next((p for p in PROGRAMS if p["program_id"] == program_id), None)
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found")
    existing = await db.program_enrollments.find_one({"user_id": user["user_id"], "program_id": program_id})
    if existing:
        return {"message": "Already enrolled"}
    await db.program_enrollments.insert_one({"user_id": user["user_id"], "program_id": program_id, "completed_days": [], "reflections": {}, "started_at": datetime.now(timezone.utc).isoformat()})
    return {"message": "Enrolled"}

@api_router.post("/programs/{program_id}/complete-day")
async def complete_program_day(program_id: str, data: DayComplete, user: dict = Depends(get_current_user)):
    enrollment = await db.program_enrollments.find_one({"user_id": user["user_id"], "program_id": program_id})
    if not enrollment:
        raise HTTPException(status_code=404, detail="Not enrolled")
    completed = enrollment.get("completed_days", [])
    if data.day not in completed:
        completed.append(data.day)
    reflections = enrollment.get("reflections", {})
    if data.reflection:
        reflections[str(data.day)] = data.reflection
    await db.program_enrollments.update_one({"user_id": user["user_id"], "program_id": program_id}, {"$set": {"completed_days": completed, "reflections": reflections}})
    return {"completed_days": completed}

# ─── Habits ───

@api_router.get("/habits/presets")
async def get_preset_habits():
    return PRESET_HABITS

@api_router.get("/habits")
async def get_habits(user: dict = Depends(get_current_user)):
    return await db.user_habits.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(50)

@api_router.post("/habits")
async def create_habit(data: HabitCreate, user: dict = Depends(get_current_user)):
    h_id = data.habit_id or f"habit_{uuid.uuid4().hex[:8]}"
    existing = await db.user_habits.find_one({"user_id": user["user_id"], "habit_id": h_id})
    if existing:
        return {k: v for k, v in existing.items() if k != "_id"}
    habit = {"habit_id": h_id, "user_id": user["user_id"], "name": data.name, "icon": data.icon, "category": data.category, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.user_habits.insert_one(habit)
    return {k: v for k, v in habit.items() if k != "_id"}

@api_router.delete("/habits/{habit_id}")
async def delete_habit(habit_id: str, user: dict = Depends(get_current_user)):
    await db.user_habits.delete_one({"habit_id": habit_id, "user_id": user["user_id"]})
    return {"message": "Deleted"}

@api_router.post("/habits/{habit_id}/toggle")
async def toggle_habit(habit_id: str, data: HabitToggle, user: dict = Depends(get_current_user)):
    existing = await db.habit_completions.find_one({"user_id": user["user_id"], "habit_id": habit_id, "date": data.date})
    if existing:
        await db.habit_completions.delete_one({"user_id": user["user_id"], "habit_id": habit_id, "date": data.date})
        return {"completed": False}
    await db.habit_completions.insert_one({"user_id": user["user_id"], "habit_id": habit_id, "date": data.date, "created_at": datetime.now(timezone.utc).isoformat()})
    return {"completed": True}

@api_router.get("/habits/completions")
async def get_habit_completions(user: dict = Depends(get_current_user), days: int = 30):
    since = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    completions = await db.habit_completions.find({"user_id": user["user_id"], "date": {"$gte": since}}, {"_id": 0}).to_list(5000)
    return completions

# ─── Buddy ───

@api_router.get("/buddies")
async def get_buddies(user: dict = Depends(get_current_user)):
    return await db.buddies.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(10)

@api_router.post("/buddies")
async def create_buddy(data: BuddyCreate, user: dict = Depends(get_current_user)):
    buddy_id = f"buddy_{uuid.uuid4().hex[:8]}"
    buddy = {"buddy_id": buddy_id, "user_id": user["user_id"], "name": data.name, "phone": data.phone, "email": data.email, "relationship": data.relationship, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.buddies.insert_one(buddy)
    return {k: v for k, v in buddy.items() if k != "_id"}

@api_router.delete("/buddies/{buddy_id}")
async def delete_buddy(buddy_id: str, user: dict = Depends(get_current_user)):
    await db.buddies.delete_one({"buddy_id": buddy_id, "user_id": user["user_id"]})
    return {"message": "Deleted"}

@api_router.post("/buddies/{buddy_id}/alert")
async def alert_buddy(buddy_id: str, user: dict = Depends(get_current_user)):
    buddy = await db.buddies.find_one({"buddy_id": buddy_id, "user_id": user["user_id"]}, {"_id": 0})
    if not buddy:
        raise HTTPException(status_code=404, detail="Buddy not found")
    # TODO: Send actual notification (email/SMS) in future
    await db.buddy_alerts.insert_one({"user_id": user["user_id"], "buddy_id": buddy_id, "buddy_name": buddy["name"], "created_at": datetime.now(timezone.utc).isoformat()})
    return {"message": f"Alert sent to {buddy['name']}", "note": "Notification delivery coming soon"}

# ─── Data & Privacy Routes ───

@api_router.get("/export")
async def export_data(request: Request, user: dict = Depends(get_current_user)):
    uid = user["user_id"]
    urges = await db.urges.find({"user_id": uid}, {"_id": 0}).to_list(None)
    relapses = await db.relapses.find({"user_id": uid}, {"_id": 0}).to_list(None)
    motivations = await db.motivations.find({"user_id": uid}, {"_id": 0}).to_list(None)
    habits = await db.user_habits.find({"user_id": uid}, {"_id": 0}).to_list(None)
    completions = await db.habit_completions.find({"user_id": uid}, {"_id": 0}).to_list(None)
    reminders = await db.reminders.find_one({"user_id": uid}, {"_id": 0})
    enrollments = await db.program_enrollments.find({"user_id": uid}, {"_id": 0}).to_list(None)
    buddies_list = await db.buddies.find({"user_id": uid}, {"_id": 0}).to_list(None)
    profile = {k: v for k, v in user.items() if k not in ("password_hash",)}

    resisted = sum(1 for u in urges if u.get("outcome") == "resisted")

    export = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "note": "This file contains all data Anchr has stored for your account.",
        "summary": {
            "name": user.get("name"),
            "email": user.get("email"),
            "member_since": user.get("created_at"),
            "currently_working_on": user.get("custom_urge_type") if user.get("urge_type") == "other" else user.get("urge_type"),
            "total_urges_tracked": len(urges),
            "total_urges_resisted": resisted,
            "total_relapses": len(relapses),
            "total_motivations_saved": len(motivations),
            "total_habits": len(habits),
            "total_programs_enrolled": len(enrollments),
            "accountability_buddies": len(buddies_list),
        },
        "profile": profile,
        "urges": {
            "count": len(urges),
            "description": "Every urge session you have started",
            "records": urges,
        },
        "relapses": {
            "count": len(relapses),
            "description": "Relapse events you have logged",
            "records": relapses,
        },
        "motivations": {
            "count": len(motivations),
            "description": "Your personal motivation messages",
            "records": motivations,
        },
        "habits": {
            "count": len(habits),
            "description": "Habits you are tracking",
            "records": habits,
            "completions": {
                "count": len(completions),
                "records": completions,
            },
        },
        "programs": {
            "count": len(enrollments),
            "description": "Recovery programs you have enrolled in",
            "records": enrollments,
        },
        "reminders": reminders or {},
        "accountability_buddies": {
            "count": len(buddies_list),
            "description": "People you have added as accountability buddies",
            "records": [{k: v for k, v in b.items() if k != "email"} for b in buddies_list],
        },
    }
    await log_audit(uid, "export_data", request)
    return JSONResponse(content=export, headers={"Content-Disposition": "attachment; filename=anchr_data.json"})

@api_router.delete("/data")
async def delete_user_data(request: Request, user: dict = Depends(get_current_user)):
    uid = user["user_id"]
    await log_audit(uid, "delete_data", request)
    await db.urges.delete_many({"user_id": uid})
    await db.relapses.delete_many({"user_id": uid})
    await db.motivations.delete_many({"user_id": uid})
    await db.user_habits.delete_many({"user_id": uid})
    await db.habit_completions.delete_many({"user_id": uid})
    await db.reminders.delete_many({"user_id": uid})
    await db.program_enrollments.delete_many({"user_id": uid})
    await db.buddies.delete_many({"user_id": uid})
    await db.buddy_alerts.delete_many({"user_id": uid})
    await db.users.update_one({"user_id": uid}, {"$set": {"urge_type": None, "custom_urge_type": None}})
    return {"message": "All data deleted. Account is still active."}

@api_router.delete("/account")
async def delete_account(request: Request, user: dict = Depends(get_current_user)):
    uid = user["user_id"]
    await log_audit(uid, "delete_account", request)
    await db.urges.delete_many({"user_id": uid})
    await db.relapses.delete_many({"user_id": uid})
    await db.motivations.delete_many({"user_id": uid})
    await db.user_habits.delete_many({"user_id": uid})
    await db.habit_completions.delete_many({"user_id": uid})
    await db.reminders.delete_many({"user_id": uid})
    await db.program_enrollments.delete_many({"user_id": uid})
    await db.buddies.delete_many({"user_id": uid})
    await db.buddy_alerts.delete_many({"user_id": uid})
    await db.user_sessions.delete_many({"user_id": uid})
    await db.users.delete_one({"user_id": uid})
    return {"message": "Account and all data deleted."}

# ─── App Setup ───

# Build CORS/CSRF allowlist from env — no wildcard fallback.
# Required on Render: CORS_ORIGINS=https://anchr.site,https://your-project.vercel.app
_cors_raw = os.environ.get("CORS_ORIGINS", "")
_ALLOWED_ORIGINS: List[str] = [o.strip() for o in _cors_raw.split(",") if o.strip()]
_ALLOWED_ORIGINS_SET: set = set(_ALLOWED_ORIGINS)

if not _ALLOWED_ORIGINS:
    raise RuntimeError(
        "CORS_ORIGINS env var is required. "
        "Set it to a comma-separated list of allowed origins, e.g.: "
        "https://anchr.site,https://your-project.vercel.app"
    )

app.include_router(api_router)

# CSRF protection — Origin/Referer header validation for state-changing methods.
# Must be defined BEFORE add_middleware(CORSMiddleware) so CORS wraps it (CORS runs first,
# handling OPTIONS preflight before CSRF logic executes).
@app.middleware("http")
async def csrf_protection(request: Request, call_next):
    """
    CSRF protection via Origin/Referer validation (OWASP recommended pattern for REST APIs).
    Browsers always send the Origin header on cross-origin requests and it cannot be spoofed.
    If Origin is present and not in the allowlist, the request is rejected with 403.
    Requests with no Origin/Referer (e.g. server-to-server, curl) are passed through —
    they pose no CSRF risk because they have no browser session cookies.
    """
    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        origin = request.headers.get("origin", "")
        if not origin:
            # Fallback: derive origin from Referer (set by some browsers on navigation)
            referer = request.headers.get("referer", "")
            if referer:
                try:
                    parsed = urlparse(referer)
                    origin = f"{parsed.scheme}://{parsed.netloc}"
                except Exception:
                    origin = ""
        if origin and origin not in _ALLOWED_ORIGINS_SET:
            return JSONResponse(
                {"detail": "CSRF validation failed: origin not permitted"},
                status_code=403,
            )
    return await call_next(request)

# CORS middleware — outermost layer (handles OPTIONS preflight before any other logic).
# allow_headers is explicit — wildcard is not allowed when allow_credentials=True.
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],   # explicit, no wildcard
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
