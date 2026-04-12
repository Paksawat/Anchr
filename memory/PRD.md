# Anchr - Product Requirements Document

## Problem Statement
Build a habit tracker (Anchr) to help people control and stop urges of different addictions with free/paid tiers, guided programs, habit system, and buddy support.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Framer Motion + Recharts
- **Backend**: FastAPI (Python) + MongoDB (Motor async driver)
- **Auth**: Email/password (bcrypt + session tokens) + Google OAuth (Emergent-managed)
- **Payment**: Visual-only paywall (Stripe integration planned)

## What's Been Implemented (April 12, 2026)

### Core (Free)
- Full authentication (email/password + Google OAuth)
- Urge Timer with 5/10/15 min countdown, breathing guide, grounding, coping tools
- Trigger & emotion tracking with logging
- Progress page with weekly/monthly charts, trigger analytics, peak times
- Motivation Wall with categories, CRUD, filtering
- Relapse Recovery system (compassionate, non-punitive)
- Reminder settings
- Danish language support with geo-detection

### Premium Features (Paid Tier - Visual Paywall)
- **Urge Type Selection**: 10 preset types (Smoking, Drinking, Gambling, etc.) + custom
- **Guided Programs**: 4 pre-built programs with daily insight/action/reflection
  - 14-Day Urge Reset (14 days)
  - 30 Days to Break the Habit (30 days)
  - Trigger Mastery (14 days)
  - Night Control Program (7 days)
- **Habit System**: 10 preset habits + custom, daily completion tracking, streaks
- **Accountability Buddy**: Add contacts, alert button (notification delivery TODO)
- **Anti-Relapse Insights**: Rule-based pattern analysis (peak times, trigger patterns, habit correlation)
- **Free/Paid tier gating** with UpgradePrompt component

## Prioritized Backlog
### P0 - Revenue
- Stripe integration for actual payments
- Buddy notification delivery (email/SMS via Twilio/SendGrid)

### P1 - Engagement
- Push notifications for reminders
- Streak milestone celebrations
- Onboarding flow after registration (urge type selection)
- Smart habit suggestions based on triggers

### P2 - Growth
- Data export (CSV/PDF)
- Community features
- More languages (Norwegian, Swedish)
