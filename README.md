# DBHS Music Lost and Found

A web app for the Diamond Bar High School Instrumental Music Program to log and browse lost-and-found items. Staff can submit and manage items; students and parents can browse what's been found.

## Features

- **Browse page** — public view of all current lost-and-found items with search and filtering
- **Staff dashboard** — authenticated staff can submit new items with photos and descriptions
- **Admin panel** — role-based admin access to manage all listings and users
- **PWA install** — visitors can install the site as an app on their phone directly from the browser (no app store required)

## Tech stack

- [React](https://react.dev) + [Vite](https://vite.dev)
- [Supabase](https://supabase.com) — database, auth, and image storage
- [React Router](https://reactrouter.com) — client-side routing
- Deployed on [Vercel](https://vercel.com)

## Local development

1. Clone the repo
2. Install dependencies: `npm install`
3. Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the dev server: `npm run dev`

## Project structure

```
src/
  components/
    Header.jsx        # Top nav bar with install button
    InstallButton.jsx # PWA install prompt (Android + iOS)
    Sidebar.jsx       # Filter sidebar on browse page
  pages/
    BrowsePage.jsx    # Public item gallery
    DashboardPage.jsx # Staff item submission
    AdminPage.jsx     # Admin management panel
    LoginPage.jsx     # Staff login
  lib/
    supabaseClient.js # Supabase client singleton
    AuthContext.jsx   # Auth state provider
public/
  manifest.json       # Web app manifest (PWA)
  sw.js               # Service worker (enables install prompt)
```
