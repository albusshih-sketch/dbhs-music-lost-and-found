# DBHS Lost & Found — Code Walkthrough

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
      AuthContext.jsx      ← tracks who is logged in
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
This file stores your two secret Supabase credentials:
- `VITE_SUPABASE_URL` — the address of your database
- `VITE_SUPABASE_ANON_KEY` — a public key that identifies your project

These are kept in `.env` and out of your code so they never accidentally get uploaded to GitHub where anyone could see them. Vite reads this file at build time and injects the values wherever you use `import.meta.env.VITE_...`.

**Rule:** Never paste your actual keys directly into a `.jsx` or `.js` file.

---

### `src/main.jsx`
This is the very first file that runs when someone opens your website. It does one job: it finds the `<div id="root">` element in your `index.html` file and tells React to take over that element and render your entire app inside it.

```jsx
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
```

Think of this as the ignition key — it starts the engine (React) and hands control to `App.jsx`.

---

### `src/App.jsx`
This is the traffic controller of the entire application. It does two things:

1. **Wraps everything in `AuthProvider`** so every page in the app can ask "who is logged in right now?"
2. **Sets up routing** — it maps URL paths to page components:
   - `/` → BrowsePage (public student view)
   - `/login` → LoginPage
   - `/dashboard` → DashboardPage
   - `/admin` → AdminPage

When a user types a URL or clicks a link, React Router reads the path and renders the matching component. No full page reload happens — React swaps the content instantly, which is why it feels fast.

---

### `src/lib/supabaseClient.js`
This file creates one single connection to your Supabase database. Think of it like a phone line — you set it up once here, and every other file in the project just "picks up the phone" by importing `supabase` from this file.

```js
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

`createClient` takes your URL and key and returns a `supabase` object. Every database query in the project uses this same object.

---

### `src/lib/AuthContext.jsx`
This file solves a specific problem: if you're logged in as a teacher, how does the Header know to show "Dashboard"? How does the AdminPage know to show admin content? Every component would need to separately ask Supabase "who is logged in?" — which is repetitive and slow.

Instead, `AuthContext` asks Supabase once when the app loads, and then shares the answer with every component in the app through React's Context system.

It provides two values:
- `user` — the currently logged-in user object (or `null` if nobody is logged in)
- `role` — either `'teacher'` or `'admin'`, fetched from the `profiles` table

Any component can access these by calling `const { user, role } = useAuth()`.

The `useEffect` hook runs once when the app starts. It does two things:
1. Checks if there's already an active session (e.g. the user logged in yesterday and their session is still valid)
2. Sets up a listener for login/logout events — so if you log out, `user` immediately becomes `null` everywhere in the app

---

### `src/components/Header.jsx`
The navigation bar shown at the top of every page. It's a "component" rather than a "page" because it's reused across all pages rather than having its own route.

It uses `useAuth()` to read `user` and `role`, then conditionally renders different buttons:
- Nobody logged in → shows "Staff login" link
- Logged in as teacher → shows "Dashboard" and "Sign out"
- Logged in as admin → shows "Admin panel", "Dashboard", and "Sign out"

The `handleSignOut` function calls `supabase.auth.signOut()` which clears the session, then uses `useNavigate` to redirect back to the home page.

---

### `src/pages/BrowsePage.jsx`
The public page every student sees. No login required.

When this page loads, `useEffect` runs `fetchItems()` immediately. `fetchItems` makes a Supabase query:

```js
supabase.from('items').select('*').order('created_at', { ascending: false })
```

In plain English: "Give me all rows from the items table, newest first."

The results are stored in the `items` state variable using `useState`. React automatically re-renders the page whenever `items` changes — so the cards appear as soon as the data arrives.

The search bar filters the `items` array in real time using JavaScript's `.filter()` method. It checks if the search term appears in the title, description, or location of each item. This filtering happens entirely in the browser — no new database queries needed.

---

### `src/pages/LoginPage.jsx`
A simple form that takes an email and password, then calls:

```js
supabase.auth.signInWithPassword({ email, password })
```

If Supabase confirms the credentials are valid, it creates a session and `AuthContext` automatically picks it up (because of the `onAuthStateChange` listener we set up). The user is then redirected to `/dashboard`.

If the credentials are wrong, Supabase returns an error and we display "Invalid email or password."

Note: we never store passwords ourselves. Supabase handles all password hashing and verification securely.

---

### `src/pages/DashboardPage.jsx`
The teacher's workspace. It has two main features: posting items and deleting items.

**Fetching items:**
```js
supabase.from('items').select('*').eq('posted_by', user.email)
```
The `.eq('posted_by', user.email)` part means "only give me rows where posted_by matches my email." Teachers only see their own items here — they can't see or delete each other's posts.

**Posting a new item (two-step process):**
1. If a photo was selected, upload it to Supabase Storage first. The storage returns a public URL for the image.
2. Insert a new row into the `items` table, including the image URL from step 1.

The form uses controlled inputs — each field's value is stored in a `form` state object, and every keystroke updates that object via `onChange`. When the form is submitted, we read from that state object to build the database insert.

**Deleting an item:**
```js
supabase.from('items').delete().eq('id', item.id)
```
This deletes the row where the id matches. We use `window.confirm()` first to prevent accidental deletions — the browser shows a popup asking "Are you sure?"

---

### `src/pages/AdminPage.jsx`
The admin-only panel. The first thing it does on load is check the user's role:

```js
if (!loading && (!user || role !== 'admin')) navigate('/')
```

If someone who isn't an admin somehow navigates to `/admin`, they get immediately redirected to the home page. This is called a "route guard."

**Items tab:**
Unlike the teacher dashboard which filters by `posted_by`, the admin query has no filter:
```js
supabase.from('items').select('*')
```
This returns all items from all teachers. The admin can delete any of them.

**Teachers tab:**
Reads from the `profiles` table to list all users and their roles. The admin account itself shows an "Admin" badge and has no delete button (so you can't accidentally delete yourself).

**Adding a teacher:**
Calls `supabase.auth.signUp()` with the new teacher's email and password. Supabase creates the user, and the trigger we set up automatically creates their profile row with `role = 'teacher'`. No manual database work needed.

---

## Key Concepts Summary

| Concept | What it means in this project |
|---|---|
| State (`useState`) | A variable that, when changed, causes React to re-render the page |
| Effect (`useEffect`) | Code that runs automatically when a component loads |
| Context (`useContext`) | A way to share data (like login status) across all components without passing it manually |
| RLS (Row Level Security) | Supabase rules that control who can read/write each table |
| Trigger | A Supabase database rule that runs automatically when something happens (like a new user being created) |
| Route | A mapping between a URL path and a React component |
| Controlled input | A form field whose value is stored in React state and updated on every keystroke |

---

## How Data Flows Through the App

```
User opens site
  → main.jsx boots React
  → App.jsx wraps everything in AuthProvider
  → AuthContext checks for existing session
  → Header renders correct nav based on login state
  → React Router renders the correct page based on URL
  → Page queries Supabase for data
  → Supabase checks RLS policies
  → Data returns and React renders it on screen
```
