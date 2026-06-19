# DBHS Music Lost & Found — Code Walkthrough

This document explains every file in the project in plain English.
Think of it as a guided tour of your own codebase.

---

## Project Structure

```
dbhs-lost-and-found/
  src/
    main.jsx               ← boots up the app
    App.jsx                ← traffic controller / routing
    index.css              ← global styles
    lib/
      supabaseClient.js    ← database connection
      AuthContext.jsx      ← tracks who is logged in + their role
    components/
      Header.jsx           ← navigation bar
    pages/
      BrowsePage.jsx       ← public student view
      LoginPage.jsx        ← teacher/admin login
      DashboardPage.jsx    ← teacher post/delete interface
      AdminPage.jsx        ← admin management panel
  .env                     ← secret keys (never uploaded to GitHub)
  package.json             ← list of all installed packages
  vite.config.js           ← Vite configuration
```

---

## File-by-File Explanation

---

### `.env`
Stores your two secret Supabase credentials:
- `VITE_SUPABASE_URL` — the address of your database (just the base URL, no `/rest/v1/` at the end)
- `VITE_SUPABASE_ANON_KEY` — a public key that identifies your project

These are kept in `.env` and out of your code so they never accidentally get uploaded to GitHub. Vite reads this file at build time and injects the values wherever you use `import.meta.env.VITE_...`.

**Common mistake:** Adding `/rest/v1/` to the end of the URL. The Supabase library adds this automatically — if it's already in your URL, it gets doubled and causes 404 errors on every database query.

**Rule:** Never paste your actual keys directly into a `.jsx` or `.js` file.

---

### `src/main.jsx`
The very first file that runs. It finds the `<div id="root">` element in `index.html` and tells React to take over that element and render the entire app inside it.

```jsx
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
```

Think of this as the ignition key — it starts the engine (React) and hands control to `App.jsx`.

---

### `src/App.jsx`
The traffic controller of the entire application. It does two things:

1. **Wraps everything in `AuthProvider`** so every page can ask "who is logged in right now and what is their role?"
2. **Sets up routing** — maps URL paths to page components:
   - `/` → BrowsePage (public student view)
   - `/login` → LoginPage
   - `/dashboard` → DashboardPage
   - `/admin` → AdminPage

When a user types a URL or clicks a link, React Router reads the path and renders the matching component instantly — no full page reload.

---

### `src/lib/supabaseClient.js`
Creates one single connection to your Supabase database. Think of it like a phone line — set up once here, and every other file just "picks up the phone" by importing `supabase` from this file.

```js
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

`createClient` takes your URL and key and returns a `supabase` object that every database query in the project uses.

---

### `src/lib/AuthContext.jsx`
Solves a specific problem: if you're logged in as a teacher, how does the Header know to show "Dashboard"? How does AdminPage know to show admin content? Every component would need to separately ask Supabase "who is logged in?" — which is repetitive and slow.

Instead, `AuthContext` asks Supabase once when the app loads, then shares the answer with every component through React's Context system.

It provides three values:
- `user` — the currently logged-in user object (or `null` if nobody is logged in)
- `role` — either `'teacher'` or `'admin'`, fetched from the `profiles` table
- `loading` — `true` while the session is still being checked, `false` once done

Any component accesses these by calling `const { user, role, loading } = useAuth()`.

The `useEffect` hook runs once on app start and does two things:
1. Checks for an existing active session (e.g. the user logged in yesterday)
2. Sets up a listener for login/logout events — so if you log out, `user` immediately becomes `null` everywhere

`fetchRole()` reads the user's role from the `profiles` table using their unique user ID. This is how the app knows whether to show the Admin panel or not.

---

### `src/components/Header.jsx`
The navigation bar shown at the top of every page. It's a component rather than a page because it's reused across all pages rather than having its own route.

It uses `useAuth()` to read `user` and `role`, then conditionally renders different buttons:
- Nobody logged in → shows "Staff login" link
- Logged in as teacher → shows "Dashboard" and "Sign out"
- Logged in as admin → shows "Admin panel", "Dashboard", and "Sign out"

`handleSignOut` calls `supabase.auth.signOut()` which clears the session, then redirects back to the home page.

---

### `src/pages/BrowsePage.jsx`
The public page every student sees. No login required.

When this page loads, `useEffect` runs `fetchItems()` immediately:

```js
supabase.from('items').select('*').order('created_at', { ascending: false })
```

In plain English: "Give me all rows from the items table, newest first."

Results are stored in the `items` state variable. React automatically re-renders whenever `items` changes, so cards appear as soon as data arrives.

The search bar filters the `items` array in real time using JavaScript's `.filter()` method — checking if the search term appears in the title, description, or location. This filtering happens entirely in the browser with no new database queries.

---

### `src/pages/LoginPage.jsx`
A simple form that takes an email and password, then calls:

```js
supabase.auth.signInWithPassword({ email, password })
```

If Supabase confirms the credentials are valid, it creates a session and `AuthContext` automatically picks it up via the `onAuthStateChange` listener. The user is redirected to `/dashboard`.

If credentials are wrong, Supabase returns an error and we display "Invalid email or password."

Passwords are never stored by us — Supabase handles all password hashing and verification securely.

---

### `src/pages/DashboardPage.jsx`
The teacher's workspace. Two main features: posting items and deleting items.

**Fetching items:**
```js
supabase.from('items').select('*').eq('posted_by', user.email)
```
`.eq('posted_by', user.email)` means "only give me rows where posted_by matches my email." Teachers only see their own items — they can't see or delete each other's posts.

**Posting a new item (two-step process):**
1. If a photo was selected, upload it to Supabase Storage first. Storage returns a public URL.
2. Insert a new row into the `items` table, including the image URL from step 1.

The form uses controlled inputs — each field's value is stored in a `form` state object, updated on every keystroke. When submitted, we read from that state object to build the database insert.

**Deleting an item:**
```js
supabase.from('items').delete().eq('id', item.id)
```
Deletes the row where the id matches. `window.confirm()` shows a browser popup first to prevent accidental deletions.

---

### `src/pages/AdminPage.jsx`
The admin-only panel. The first thing it does on load is check the user's role:

```js
if (!loading && (!user || role !== 'admin')) navigate('/')
```

If someone who isn't an admin navigates to `/admin`, they get immediately redirected to the home page. This is called a route guard.

**Items tab:**
Unlike the teacher dashboard which filters by `posted_by`, the admin query has no filter — returns all items from all teachers. The admin can delete any of them.

**Teachers tab:**
Reads from the `profiles` table to list all users and their roles.

**Promote to admin:**
```js
supabase.from('profiles').update({ role: 'admin' }).eq('id', id)
```
Changes a teacher's role to admin in the profiles table. They immediately gain admin access on their next page load.

**Demote to teacher:**
```js
supabase.from('profiles').update({ role: 'teacher' }).eq('id', id)
```
Changes an admin's role back to teacher. Protected by a check — you cannot demote yourself:
```js
if (id === user.id) {
  alert("You cannot demote yourself. Ask another admin to do this.")
  return
}
```
This prevents every admin from accidentally locking themselves out.

**Adding a teacher:**
Calls `supabase.auth.signUp()` with the new teacher's email and password. Supabase creates the user, sends them a confirmation email, and the trigger automatically creates their profile row with `role = 'teacher'`.

**Removing a teacher (important — two steps required):**
The "Remove" button in the Admin panel only deletes the teacher's row from the `profiles` table. It does NOT delete their Supabase Auth account — they can still log in. The full removal process requires a second manual step in the Supabase Dashboard (see Maintenance Guide).

---

## Supabase Database Structure

### `items` table
| Column | Type | Purpose |
|---|---|---|
| id | uuid | Unique identifier, auto-generated |
| title | text | Item name (e.g. "Blue Backpack") |
| description | text | Physical description |
| location | text | Where to pick it up |
| date_found | date | When it was found |
| image_url | text | Public URL of the uploaded photo |
| posted_by | text | Email of the teacher who posted it |
| created_at | timestamp | Auto-set when row is created |

### `profiles` table
| Column | Type | Purpose |
|---|---|---|
| id | uuid | Matches the user's Supabase Auth ID |
| email | text | User's email address |
| role | text | Either 'teacher' or 'admin' |

### RLS Policies on `items`
| Policy | Role | Operation |
|---|---|---|
| Anyone can view items | anon | SELECT |
| Authenticated users can view items | authenticated | SELECT |
| Authenticated users can insert items | authenticated | INSERT |
| Authenticated users can delete items | authenticated | DELETE |

### RLS Policies on `profiles`
| Policy | Role | Operation |
|---|---|---|
| Users can view their own profile | authenticated | SELECT |
| Admin can view all profiles | authenticated | SELECT |
| Admin can update profiles | authenticated | UPDATE |
| Admin can delete profiles | authenticated | DELETE |

---

## Key Concepts Summary

| Concept | What it means in this project |
|---|---|
| State (`useState`) | A variable that, when changed, causes React to re-render the page |
| Effect (`useEffect`) | Code that runs automatically when a component loads |
| Context (`useContext`) | A way to share data (like login status) across all components |
| RLS (Row Level Security) | Supabase rules controlling who can read/write each table |
| Trigger | A database rule that runs automatically when something happens |
| Route guard | Code that redirects unauthorized users away from protected pages |
| Controlled input | A form field whose value is stored in React state |

---

## How Data Flows Through the App

```
User opens site
  → main.jsx boots React
  → App.jsx wraps everything in AuthProvider
  → AuthContext checks for existing session + fetches role
  → Header renders correct nav based on login state and role
  → React Router renders the correct page based on URL
  → Page queries Supabase for data
  → Supabase checks RLS policies
  → Data returns and React renders it on screen
```
