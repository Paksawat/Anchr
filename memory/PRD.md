# Habit Reset - Product Requirements Document

## Problem Statement
Build a habit tracker to help people control and stop urges of different addictions, track progress, interrupt urges, and build healthier habits.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Framer Motion + Recharts
- **Backend**: FastAPI (Python) + MongoDB (Motor async driver)
- **Auth**: Email/password (bcrypt + session tokens) + Google OAuth (Emergent-managed)
- **Database**: MongoDB (test_database)

## User Personas
- People recovering from various addictions who need real-time urge management tools
- Individuals wanting to track habits and build healthier routines
- Users needing non-judgmental recovery tracking

## Core Requirements
- Urge Timer with breathing guide and countdown visualization
- Trigger tracking (what, when, emotion)
- Progress tracking (streak, stats, charts)
- Quick coping tools (breathing, grounding, activity suggestions)
- Motivation reminders (personal messages)
- Relapse recovery system (compassionate, non-punitive)
- User authentication (email/password + Google OAuth)
- Reminder settings

## What's Been Implemented (April 12, 2026)
- Full authentication system (email/password + Google OAuth)
- Dashboard with streak counter, stats, quick actions, motivation preview
- Urge Timer with 5/10/15 min countdown, trigger/emotion logging, intensity tracking
- Breathing exercise with animated circle (inhale/hold/exhale)
- 5-4-3-2-1 Grounding exercise
- Coping suggestions (walk, drink water, call someone, step outside)
- Progress page with weekly/monthly area charts, trigger analytics, peak times
- Motivation Wall with categories, CRUD, filtering
- Settings with reminder configuration, relapse recovery log
- Responsive sidebar navigation
- Calm sage green design palette (Outfit + Figtree fonts)

## Testing Status
- Backend: 100% (15/15 endpoints)
- Frontend: 100% (all features)
- Integration: 100%

## Prioritized Backlog
### P0 (Critical)
- All core features implemented ✅

### P1 (High)
- Push notifications for reminders (browser/mobile)
- Data export (CSV/PDF progress reports)
- Habit goals & milestones system

### P2 (Medium)
- Dark mode toggle
- Community/accountability partner features
- Custom habit categories
- Journaling/reflection prompts

### Next Tasks
- Implement browser push notifications for reminders
- Add streak milestone celebrations (7 days, 30 days, etc.)
- Add data export functionality
- Consider AI-powered insights for trigger patterns
