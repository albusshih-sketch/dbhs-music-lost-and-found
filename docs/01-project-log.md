# DBHS Lost & Found — Project Log

**Project:** DBHS Lost & Found Website  
**Intern:** Albus Shih  
**Supervisor:** IT Admin, Diamond Bar High School  
**Started:** June 2026  
**Stack:** React + Vite, Supabase, Vercel (deployment pending)

---

## Purpose

Teachers at DBHS frequently find items left in classrooms or dropped off at the Lost & Found. Students had no way to check whether their missing item had been found without physically walking to each location. This project solves that by giving teachers a simple way to post found items online, and students a public page to browse them — no login required.

---

## Decision Log

### Why no "claim" button for students?
Early in planning, we considered letting students click a button to claim an item online. We decided against it for two reasons:
1. A student could falsely claim an item that isn't theirs, with no way to verify online.
2. Physical verification (showing up in person, describing the item) is safer and already natural in a school environment.
The website helps students *find* their item — the actual handoff stays in person.

### Why manual deletion by teachers instead of auto-deletion?
We considered auto-deleting items once claimed. We rejected this because it removes the human verification step. A teacher should confirm the item was actually picked up before removing it from the board. Manual deletion keeps a human in the loop.

### Why no student login?
Requiring students to log in adds friction and raises privacy concerns (collecting student data). Since students only need to *view* items, not post or modify anything, requiring login would be unnecessary. Students browse anonymously.

### Why Supabase?
Supabase provides database, file storage, and user authentication all in one free package. It's beginner-friendly, well-documented, and scales well if the project grows. It was the most practical choice for a solo intern project.

### Why React + Vite?
React is the most widely used frontend framework, making this project good portfolio experience. Vite is a fast, modern build tool that pairs well with React and requires minimal configuration.

### Why Vercel for deployment?
Vercel is free, integrates directly with GitHub, and deploys automatically whenever you push new code. It's the standard deployment platform for React projects.

---

## Step-by-Step Build Log

### Phase 1 — Planning & Setup
- Defined user roles: students (view only), teachers (post/delete their own items), admin (manage everything)
- Decided on tech stack: React + Vite, Supabase, Vercel
- Created GitHub account and repository: `dbhs-lost-and-found`
- Installed Node.js (v24) and initialized Git in the project folder
- Connected local project folder to GitHub remote repository
- Made first commit: README.md

### Phase 2 — Supabase Setup
- Created Supabase project: `dbhs-lost-and-found`
- Created `items` table with fields: id, title, description, location, date_found, image_url, posted_by, created_at
- Enabled Row Level Security (RLS) on the items table
- Set up RLS policies:
  - `anon` role: SELECT only (students can view)
  - `authenticated` role: INSERT and DELETE (teachers can post and remove)
  - `authenticated` role: SELECT (teachers can view items on their dashboard) — added later when bug was discovered
- Created `item-images` storage bucket (public)
- Set up storage policies for viewing, uploading, and deleting images
- Created `profiles` table to store user roles (teacher/admin)
- Created a database trigger (`on_auth_user_created`) that automatically inserts a profile row with `role = 'teacher'` every time a new user is created
- Manually inserted admin profile for the IT intern account

### Phase 3 — Project Initialization
- Scaffolded React project using Vite: `npm create vite@latest . -- --template react`
- Installed dependencies: `react-router-dom`, `@supabase/supabase-js`
- Created `.env` file with Supabase URL and anon key
- Added `.env` to `.gitignore` to prevent secret keys from being uploaded to GitHub
- Switched VS Code terminal default from PowerShell to Git Bash

### Phase 4 — Core Features Built
- `src/lib/supabaseClient.js` — Supabase connection
- `src/lib/AuthContext.jsx` — global login state + role tracking
- `src/components/Header.jsx` — navigation bar
- `src/pages/BrowsePage.jsx` — public student view
- `src/pages/LoginPage.jsx` — teacher/admin login
- `src/pages/DashboardPage.jsx` — teacher post/delete interface
- `src/App.jsx` — routing between all pages
- `src/main.jsx` — app entry point

### Phase 5 — Bug Fixes
- **Bug:** Supabase URL had `/rest/v1/` appended in `.env`, causing double path and 404 errors.  
  **Fix:** Removed `/rest/v1/` from the URL in `.env` — the Supabase library appends this automatically.
- **Bug:** Teacher dashboard showed "No items posted yet" even though items existed in the database.  
  **Fix:** Added a missing RLS policy allowing `authenticated` users to SELECT from the `items` table.

### Phase 6 — Admin Panel
- Built `src/pages/AdminPage.jsx` — admin-only page
- Updated `AuthContext.jsx` to fetch user role from `profiles` table
- Updated `Header.jsx` to show "Admin panel" link only to admin users
- Added `/admin` route to `App.jsx`
- Added RLS policy allowing admin to view all profiles
- Tested: admin can view/delete all items, add teacher accounts, view all teachers

---

## Current Status
The application is fully functional locally at `http://localhost:5173`.  
Next step: deploy to Vercel for a live public URL.

---

## GitHub Repository
`https://github.com/albusshih-sketch/dbhs-lost-and-found`
