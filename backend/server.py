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
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from stats_helpers import calculate_streak, calculate_period_data, calculate_best_streak
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
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class SessionExchange(BaseModel):
    session_id: str

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
    times: List[str] = []
    days: List[str] = []

class RelapseCreate(BaseModel):
    trigger: Optional[str] = None
    emotion: Optional[str] = None
    notes: Optional[str] = None

class ProfileUpdate(BaseModel):
    urge_type: Optional[str] = None
    custom_urge_type: Optional[str] = None
    tier: Optional[str] = None

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
async def register(data: UserRegister, response: Response):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    user_doc = {"user_id": user_id, "email": data.email, "name": data.name, "password_hash": hash_password(data.password), "picture": None, "created_at": now, "auth_provider": "email", "urge_type": None, "custom_urge_type": None, "tier": "free"}
    await db.users.insert_one(user_doc)
    token = create_session_token()
    await db.user_sessions.insert_one({"user_id": user_id, "session_token": token, "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(), "created_at": now})
    set_session_cookie(response, token)
    return {"user_id": user_id, "email": data.email, "name": data.name, "picture": None, "created_at": now, "urge_type": None, "custom_urge_type": None, "tier": "free"}

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
    await db.user_sessions.insert_one({"user_id": user["user_id"], "session_token": token, "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(), "created_at": now})
    set_session_cookie(response, token)
    return {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "picture": user.get("picture"), "created_at": user.get("created_at"), "urge_type": user.get("urge_type"), "custom_urge_type": user.get("custom_urge_type"), "tier": user.get("tier", "free")}

@api_router.post("/auth/session")
async def exchange_session(data: SessionExchange, response: Response):
    async with httpx.AsyncClient() as hc:
        resp = await hc.get("https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data", headers={"X-Session-ID": data.session_id})
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session ID")
    google_data = resp.json()
    user = await db.users.find_one({"email": google_data["email"]}, {"_id": 0})
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        user = {"user_id": user_id, "email": google_data["email"], "name": google_data.get("name", ""), "picture": google_data.get("picture"), "created_at": now, "auth_provider": "google", "urge_type": None, "custom_urge_type": None, "tier": "free"}
        await db.users.insert_one(user)
    else:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"name": google_data.get("name", user["name"]), "picture": google_data.get("picture", user.get("picture"))}})
        user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    token = create_session_token()
    now = datetime.now(timezone.utc).isoformat()
    await db.user_sessions.insert_one({"user_id": user["user_id"], "session_token": token, "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(), "created_at": now})
    set_session_cookie(response, token)
    return {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "picture": user.get("picture"), "created_at": user.get("created_at"), "urge_type": user.get("urge_type"), "custom_urge_type": user.get("custom_urge_type"), "tier": user.get("tier", "free")}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "picture": user.get("picture"), "created_at": user.get("created_at"), "urge_type": user.get("urge_type"), "custom_urge_type": user.get("custom_urge_type"), "tier": user.get("tier", "free")}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
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
    if data.tier is not None:
        updates["tier"] = data.tier
    if updates:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": updates})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {"user_id": updated["user_id"], "email": updated["email"], "name": updated["name"], "picture": updated.get("picture"), "urge_type": updated.get("urge_type"), "custom_urge_type": updated.get("custom_urge_type"), "tier": updated.get("tier", "free")}

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
    return {"streak_days": streak_days, "best_streak": calculate_best_streak(relapses, streak_days), "urges_resisted": urges_resisted, "total_urges": total_urges, "total_relapses": len(relapses), "resist_rate": round(urges_resisted / total_urges * 100) if total_urges > 0 else 0, "weekly": calculate_period_data(urges, now, 7), "monthly": calculate_period_data(urges, now, 30)}

@api_router.get("/stats/triggers")
async def get_trigger_stats(user: dict = Depends(get_current_user), urge_type: Optional[str] = None):
    urge_query = {"user_id": user["user_id"]}
    if urge_type:
        urge_query["urge_type"] = urge_type
    urges = await db.urges.find(urge_query, {"_id": 0}).to_list(1000)
    triggers, emotions, hours = {}, {}, {}
    for u in urges:
        t = u.get("trigger") or "Unknown"
        triggers[t] = triggers.get(t, 0) + 1
        e = u.get("emotion") or "Unknown"
        emotions[e] = emotions.get(e, 0) + 1
        h = u.get("hour_of_day", 0)
        hours[h] = hours.get(h, 0) + 1
    return {"triggers": [{"name": k, "count": v} for k, v in sorted(triggers.items(), key=lambda x: -x[1])], "emotions": [{"name": k, "count": v} for k, v in sorted(emotions.items(), key=lambda x: -x[1])], "hours": [{"hour": k, "count": v} for k, v in sorted(hours.items())], "top_trigger": max(triggers, key=triggers.get) if triggers else None, "peak_hour": max(hours, key=hours.get) if hours else None}

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
            insights.append({"type": "warning", "title": "High-risk time approaching", "message": "You usually feel urges around this time. Stay prepared.", "action": "Use the urge timer or breathing exercise"})
    # Top trigger insight
    triggers = {}
    for u in urges:
        t = u.get("trigger")
        if t:
            triggers[t] = triggers.get(t, 0) + 1
    if triggers:
        top = max(triggers, key=triggers.get)
        insights.append({"type": "insight", "title": f"{top} is your #1 trigger", "message": f"{top} has triggered {triggers[top]} urges. Build specific defenses for this.", "action": "Create an if-then plan for this trigger"})
    # Habit correlation
    if habits_completed and urges:
        habit_dates = set(h.get("date") for h in habits_completed)
        urge_dates_with_habits = len([u for u in urges if u["created_at"][:10] in habit_dates])
        urge_dates_without = len(urges) - urge_dates_with_habits
        if len(habit_dates) > 3 and urge_dates_without > urge_dates_with_habits:
            reduction = round((1 - urge_dates_with_habits / max(urge_dates_without, 1)) * 100)
            if reduction > 0:
                insights.append({"type": "positive", "title": "Habits are working", "message": f"On days you complete habits, you have {reduction}% fewer urges.", "action": "Keep your habit streak going"})
    # Evening warning
    evening_urges = len([u for u in urges if u.get("hour_of_day", 0) >= 20])
    if evening_urges > len(urges) * 0.4 and len(urges) > 5:
        insights.append({"type": "suggestion", "title": "Evening pattern detected", "message": "Most of your urges happen after 8pm. An evening routine could help.", "action": "Try the Night Control Program"})
    # Stress pattern
    stress_urges = len([u for u in urges if u.get("trigger") == "Stress" or u.get("emotion") == "Anxious"])
    if stress_urges > len(urges) * 0.3 and len(urges) > 5:
        insights.append({"type": "suggestion", "title": "Stress is a major factor", "message": "Stress and anxiety trigger many of your urges. Add stress-relief habits.", "action": "Add breathing or meditation to your daily habits"})
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

# ─── App Setup ───

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
