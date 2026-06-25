# DBHS Music Lost & Found — Project Log

**Project:** DBHS Music Lost & Found Website  
**Intern:** Albus Shih  
**Supervisor:** IT Admin, Diamond Bar High School  
**Started:** June 2026  
**Stack:** React + Vite, Supabase, Vercel

---

## Purpose

Music teachers and student presidents at DBHS frequently find instruments, accessories, and equipment left behind in the music building. Students had no way to check whether their missing item had been found without physically walking over. This project solves that by giving authorized staff a simple way to post found items online, and students a public page to browse them — no login required.

**Why music department specifically?**
An initial proposal for a school-wide Lost & Found was reviewed and determined to be impractical at scale — it would take more staff time to maintain than it would save. The music department is a focused, smaller community (~5 staff/posters) where the system is genuinely useful and manageable.

---

## User Roles

| Role | Who | What they can do |
|---|---|---|
| Student | Anyone | Browse items publicly, no login needed |
| Teacher | Music teachers, student presidents | Post items, delete their own items |
| Admin | Head band director | Everything teachers can do + manage all items and accounts |

---

## Decision Log

### Why no "claim" button for students?
A student could falsely claim an item online with no way to verify. Physical verification (showing up in person, describing the item) is safer and already natural in a school environment. The website helps students *find* their item — the actual handoff stays in person.

### Why manual deletion by teachers instead of auto-deletion?
Auto-deleting items based on a student's claim alone removes the human verification step. Teachers delete items manually when they physically hand the item over. This keeps a human in the loop.

### Why no student login?
Requiring students to log in adds friction and raises privacy concerns. Since students only need to view items, requiring login is unnecessary. Students browse anonymously.

### Why Supabase?
Supabase provides database, file storage, and user authentication all in one free package. It's beginner-friendly, well-documented, and scales well if the project grows.

### Why React + Vite?
React is the most widely used frontend framework, making this project good portfolio experience. Vite is a fast, modern build tool that pairs well with React and requires minimal configuration.

### Why Vercel for deployment?
Vercel is free, integrates directly with GitHub, and deploys automatically whenever you push new code. It's the standard deployment platform for React projects.

### Why manual account creation instead of SSO or bulk invite?
With only ~5 people posting items (music teachers + student presidents), manually adding accounts is perfectly practical. SSO was considered but requires school Google Workspace admin involvement and confirmation that all staff use `@wvusd.org` Google accounts — information not yet available. This can be revisited if the project scales.

### Why no email domain restriction?
Student presidents use `@stu.wvusd.org` accounts, which would have been blocked by a `@wvusd.org` restriction. Since the admin (band director) manually controls who gets added, domain restriction adds no meaningful security benefit here.

### Why multiple admins?
The head band director is the primary admin, but a school administrator in the admin building may also need admin access. Any admin can promote teachers to admin or demote other admins — but no admin can demote themselves, preventing accidental lockout.

---

## Step-by-Step Build Log

### Phase 1 — Planning & Setup
- Defined user roles: students (view only), teachers (post/delete their own items), admin (manage everything)
- Decided on tech stack: React + Vite, Supabase, Vercel
- Created GitHub account and repository: `dbhs-lost-and-found`
- Installed Node.js (v24) and initialized Git in the project folder
- Configured Git identity (`git config --global user.email` and `user.name`)
- Switched VS Code default terminal from PowerShell to Git Bash
- Connected local project folder to GitHub remote repository
- Made first commit: README.md

### Phase 2 — Supabase Setup
- Created Supabase project: `dbhs-lost-and-found`
- Created `items` table with fields: id, title, description, location, date_found, image_url, posted_by, created_at
- Enabled Row Level Security (RLS) on the items table
- Set up RLS policies on `items`:
  - `anon` SELECT — students can view items
  - `authenticated` INSERT — teachers can post items
  - `authenticated` DELETE — teachers can delete items
  - `authenticated` SELECT — teachers can view items on their dashboard (added later when bug was discovered)
- Created `item-images` storage bucket (public)
- Set up storage policies: anon SELECT, authenticated INSERT, authenticated DELETE
- Created `profiles` table to store user roles (teacher/admin)
- Created a database trigger (`on_auth_user_created`) that automatically inserts a profile row with `role = 'teacher'` every time a new user is created
- Manually inserted admin profile for the IT intern account (since it was created before the trigger existed)

### Phase 3 — Project Initialization
- Scaffolded React project using Vite: `npm create vite@latest . -- --template react`
- Installed dependencies: `react-router-dom`, `@supabase/supabase-js`
- Created `.env` file with Supabase URL and anon key
- Added `.env` to `.gitignore` to prevent secret keys from being uploaded to GitHub
- Fixed `.env` bug: Supabase URL had `/rest/v1/` appended, causing double path and 404 errors — removed the suffix

### Phase 4 — Core Features Built
- `src/lib/supabaseClient.js` — Supabase connection
- `src/lib/AuthContext.jsx` — global login state + role tracking
- `src/components/Header.jsx` — navigation bar
- `src/pages/BrowsePage.jsx` — public student view with search
- `src/pages/LoginPage.jsx` — teacher/admin login
- `src/pages/DashboardPage.jsx` — teacher post/delete interface with image upload
- `src/pages/AdminPage.jsx` — admin management panel
- `src/App.jsx` — routing between all pages
- `src/main.jsx` — app entry point

### Phase 5 — Bug Fixes
- **Bug:** Supabase URL had `/rest/v1/` in `.env`, causing 404 errors on all database queries.  
  **Fix:** Removed `/rest/v1/` — the Supabase library appends this automatically.
- **Bug:** Teacher dashboard showed "No items posted yet" even though items existed in the database.  
  **Fix:** Added missing RLS SELECT policy for `authenticated` users on the `items` table.
- **Bug:** Removing a teacher from the Admin panel didn't work — account still appeared.  
  **Fix:** Added missing DELETE policy on the `profiles` table.

### Phase 6 — Admin Panel & Role Management
- Built `src/pages/AdminPage.jsx` — admin-only page with route guard
- Updated `AuthContext.jsx` to fetch user role from `profiles` table
- Updated `Header.jsx` to show "Admin panel" link only to admin users
- Added `/admin` route to `App.jsx`
- Added RLS SELECT policy allowing admins to view all profiles
- Added RLS UPDATE policy allowing admins to update profiles
- Added RLS DELETE policy allowing admins to delete profiles

### Phase 7 — Multi-Admin Support
- Added "Promote to admin" button in Teachers tab — visible next to every teacher
- Added "Demote to teacher" button — visible next to every admin except the currently logged-in user
- Self-demotion prevention: admins cannot demote themselves, protecting against accidental lockout
- Tested: promote works, demote works, self-demote correctly blocked

### Phase 8 — Pivot to Music Department
- Project scope changed from school-wide to DBHS Music department specifically
- Renamed "DBHS Lost & Found" → "DBHS Music Lost & Found" in Header
- Removed `@wvusd.org` email domain restriction (student presidents use `@stu.wvusd.org`)
- Updated email placeholder in Add Teacher form
- Confirmed user group: music teachers + student presidents (~5 people total)
- Head band director designated as primary admin account

### Phase 9 — Two-Step Teacher Removal Process Established
- Discovered that removing a teacher from the `profiles` table does not delete their Supabase Auth account
- Established two-step removal workflow:
  1. Admin panel → Remove (deletes profile/role)
  2. Supabase Dashboard → Authentication → Users → Delete (removes login credentials)
- Long-term fix noted: build a Supabase Edge Function to handle Auth deletion securely

### Phase 10 — PWA Install Support
- Added `public/manifest.json` — web app manifest declaring app name, icon, theme color, and standalone display mode
- Added `public/sw.js` — minimal service worker required for the browser install prompt to fire
- Registered service worker in `src/main.jsx` on page load
- Created `src/components/InstallButton.jsx`:
  - On Android/Chrome/Edge: listens for `beforeinstallprompt`, shows a gold "📲 Install App" button in the nav bar, triggers the native install dialog on click
  - On iOS Safari: shows the same button with a tooltip guiding users to use Share → "Add to Home Screen"
  - Hides itself if the app is already installed
- Added `InstallButton` to `Header.jsx` nav bar (always visible, self-hides when not needed)
- Added CSS for `.site-nav__install` and `.install-ios-hint` tooltip
- Updated `index.html`: linked manifest, added `theme-color` and Apple PWA meta tags, updated page title to "DBHS Music Lost and Found"
- Updated `README.md` with full project documentation (replaced default Vite template boilerplate)

### Phase 11 — Vercel Deployment
- Deployed to Vercel via GitHub integration (`albusshih-sketch/dbhs-lost-and-found`)
- Added `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in Vercel project settings
- Future pushes to `master` automatically rebuild and redeploy the live site

---

## Current Status
The application is live on Vercel. Any push to `master` on GitHub automatically triggers a redeployment.  
PWA install is available: users on Android can tap "📲 Install App" in the nav bar; iOS users see instructions for "Add to Home Screen."

---

## GitHub Repository
`https://github.com/albusshih-sketch/dbhs-lost-and-found`
