# DBHS Lost & Found — Maintenance & Operations Guide

This document is written for whoever manages this project long-term —
whether that's the original intern, their supervisor, or a future IT admin.
It covers day-to-day operations, common fixes, and how to extend the project.

---

## Table of Contents
1. How to run the project locally
2. How to deploy updates to the live site
3. How to manage teacher accounts
4. How to transfer admin access
5. How to change the school email domain
6. How to bulk-add teachers (100+ accounts)
7. How to add Google Sign-In (SSO) for teachers
8. How to improve the UI
9. How to add mobile app support (PWA)
10. Common issues and fixes
11. How to back up the database

---

## 1. How to Run the Project Locally

You'll need: Node.js installed, the project folder on your laptop, a Supabase account with the project set up.

```bash
cd ~/Desktop/Projects/dbhs-lost-and-found
npm run dev
```

Open `http://localhost:5173` in your browser. The site runs on your laptop only — nobody else can see it until it's deployed.

To stop the server: press `Ctrl + C` in the terminal.

---

## 2. How to Deploy Updates to the Live Site

Once the project is deployed to Vercel (see deployment step), every time you push code to GitHub, Vercel automatically rebuilds and redeploys the live site. You don't need to do anything manually.

The workflow is always:
```bash
git add .
git commit -m "describe your change"
git push
```

Vercel picks up the push within about 60 seconds and the live site updates.

To deploy for the first time:
1. Go to vercel.com and sign in with GitHub
2. Click "New Project" → import `dbhs-lost-and-found`
3. Under "Environment Variables," add:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
4. Click Deploy
5. Vercel gives you a URL like `dbhs-lost-and-found.vercel.app`

---

## 3. How to Manage Teacher Accounts

**Adding a teacher:**
1. Log into the website as admin
2. Go to Admin Panel → Teachers tab
3. Enter the teacher's school email and a temporary password
4. Click "Add teacher"
5. Share the temporary password with the teacher — they can change it later

**Removing a teacher:**
1. Log into the website as admin
2. Go to Admin Panel → Teachers tab
3. Click "Remove" next to the teacher's name

Note: removing a teacher from the profiles table does not delete their Supabase Auth account. To fully delete a user, go to Supabase Dashboard → Authentication → Users → find the user → Delete.

**Resetting a teacher's password:**
Go to Supabase Dashboard → Authentication → Users → find the user → Send password reset email.

---

## 4. How to Transfer Admin Access

When the IT intern leaves and a new person takes over, follow these steps:

**Step 1 — Create the new admin's account**
In Supabase Dashboard → Authentication → Users → Add User → enter their email and a temporary password.

**Step 2 — Set their role to admin**
Go to Supabase Dashboard → Table Editor → profiles table → find their row → edit the `role` field from `teacher` to `admin`.

**Step 3 — Remove the old admin's access**
Either delete their Supabase Auth account entirely, or change their profile role back to `teacher`.

**Step 4 — Transfer GitHub access**
Go to `github.com/albusshih-sketch/dbhs-lost-and-found` → Settings → Collaborators → Add the new person's GitHub account.

**Step 5 — Transfer Vercel access**
Go to vercel.com → Project Settings → Members → Add the new person.

---

## 5. How to Change the School Email Domain

Right now the admin panel only accepts `@dbhs.edu` addresses. If the actual school email format is different (e.g. `@chino.k12.ca.us`), change one line in the code:

Open `src/pages/AdminPage.jsx` and find:

```js
if (!newTeacher.email.endsWith('@dbhs.edu')) {
```

Change `@dbhs.edu` to whatever the real domain is:

```js
if (!newTeacher.email.endsWith('@chino.k12.ca.us')) {
```

Save, commit, and push. The live site updates automatically.

---

## 6. How to Bulk-Add Teachers (100+ Accounts)

Manually adding 100 teachers one by one is impractical. Here are two better approaches:

**Option A — CSV Bulk Invite (Recommended for now)**

Supabase supports inviting users via their API. You would:
1. Create a spreadsheet of all teacher emails
2. Write a small script that reads the spreadsheet and calls `supabase.auth.admin.inviteUserByEmail()` for each one
3. Each teacher receives an email with a link to set their own password

This requires using the Supabase **service role key** (not the anon key) — keep this key extremely private, never put it in frontend code.

Estimated build time: 1–2 days for someone comfortable with JavaScript.

**Option B — Google SSO (Best long-term solution)**

If the school uses Google Workspace (which most schools do), teachers can log in with their existing school Google account. No passwords to manage at all.

How it works:
1. Enable Google as an Auth provider in Supabase Dashboard → Authentication → Providers → Google
2. Set up a Google OAuth app in Google Cloud Console (your IT main can help with this since it requires school Google Workspace admin access)
3. Update the login page to show a "Sign in with Google" button instead of email/password
4. The trigger automatically creates their profile on first login

Estimated build time: 1–2 days. Requires coordination with school Google Workspace admin.

---

## 7. How to Add Mobile App Support (PWA)

The website already works in mobile browsers. To make it feel more like a native app (icon on home screen, works offline, etc.), add PWA support:

1. Install the Vite PWA plugin:
```bash
npm install vite-plugin-pwa
```

2. Update `vite.config.js` to include the PWA plugin with your app name and icons.

3. Teachers can then go to the website on their phone, tap the Share button → "Add to Home Screen." It appears as an app icon and opens without the browser bar.

Estimated build time: half a day.

---

## 8. How to Improve the UI

The current UI uses plain inline CSS. To make it look more polished:

**Option A — Tailwind CSS**
Tailwind is a utility-first CSS framework. Instead of writing custom CSS, you add class names like `bg-blue-500 rounded-lg p-4` directly to your HTML elements.

```bash
npm install tailwindcss @tailwindcss/vite
```

Then replace the inline styles in each component with Tailwind classes.

**Option B — shadcn/ui**
A set of pre-built, beautifully designed React components (buttons, cards, forms, modals). You copy the components you need directly into your project and customize them.

Visit: ui.shadcn.com

Estimated build time for a full UI refresh: 2–3 days.

---

## 9. Common Issues and Fixes

**"Could not load items" on the browse page**
- Check the browser console (F12 → Console) for the actual error
- Most likely cause: RLS policy missing or Supabase URL wrong in `.env`
- Fix: verify `.env` has the correct URL with no `/rest/v1/` at the end

**"No items posted yet" on the dashboard even though items exist**
- Most likely cause: missing RLS SELECT policy for authenticated users
- Fix: go to Supabase SQL Editor and run:
```sql
create policy "Authenticated users can view items"
on items for select to authenticated using (true);
```

**Teacher can't log in**
- Check Supabase Dashboard → Authentication → Users → confirm the account exists and is confirmed
- If "Email Confirmed" is false, click the user → Confirm email manually

**Image not showing up after posting**
- Check the `item-images` bucket in Supabase Storage → confirm the file was uploaded
- Check that the bucket is set to Public
- Check storage policies allow SELECT for anon

**Site works locally but not after deployment**
- Most likely cause: environment variables not set in Vercel
- Fix: go to Vercel → Project → Settings → Environment Variables → add both Supabase keys

**Changes pushed to GitHub but live site didn't update**
- Go to vercel.com → your project → Deployments tab
- Check if the latest deployment failed — click it to see the error log

---

## 10. How to Back Up the Database

Supabase automatically backs up your database daily on paid plans. On the free plan, you can manually export your data:

Go to Supabase Dashboard → Table Editor → items table → click the export button (CSV format).

For a full database backup:
Go to Supabase Dashboard → Settings → Database → scroll to "Backups."

For critical production use, consider upgrading to Supabase Pro ($25/month) for automatic daily backups with point-in-time recovery.

---

## 11. Future Features to Consider

These were discussed during the build but not implemented yet:

- **Item status (claimed/unclaimed):** Add a `status` column to the items table and let teachers mark items as claimed rather than deleting them. This preserves a history of found items.
- **Email notifications:** When a student submits a claim, send the teacher an email automatically using Supabase Edge Functions + Resend.
- **Item categories:** Add a `category` dropdown (clothing, electronics, accessories, etc.) to make browsing easier.
- **Analytics dashboard:** Show the IT admin how many items are posted per month, average time to claim, etc.
- **Dark mode:** A simple CSS variable swap — low effort, high impact for usability.
- **Multi-language support:** If the school has a significant non-English speaking population, consider adding Spanish support.

---

*This document should be updated whenever significant changes are made to the project.*
*Last updated: June 2026*
