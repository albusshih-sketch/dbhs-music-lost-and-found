# DBHS Music Lost & Found — Maintenance & Operations Guide

This document is written for whoever manages this project long-term —
whether that's the original intern, the head band director, or a future IT admin.
It covers day-to-day operations, common fixes, and how to extend the project.

---

## Table of Contents
1. How to run the project locally
2. How to deploy updates to the live site
3. How to manage teacher accounts
4. How to remove a teacher account (two-step process)
5. How to manage admin accounts
6. How to transfer admin access
7. How to bulk-add teachers (if scope expands)
8. How to add Google Sign-In (SSO)
9. How to improve the UI
10. How to add mobile app support (PWA)
11. Common issues and fixes
12. How to back up the database
13. Future features to consider

---

## 1. How to Run the Project Locally

You'll need: Node.js installed, the project folder on your laptop, a Supabase account with the project configured.

```bash
cd ~/Desktop/Projects/dbhs-lost-and-found
npm run dev
```

Open `http://localhost:5173` in your browser. The site runs on your laptop only — nobody else can see it until it's deployed.

To stop the server: press `Ctrl + C` in the terminal.

---

## 2. How to Deploy Updates to the Live Site

Once deployed to Vercel, every push to GitHub automatically rebuilds and redeploys the live site. No manual steps needed after the initial setup.

```bash
git add .
git commit -m "describe your change"
git push
```

Vercel picks up the push within ~60 seconds and the live site updates.

**To deploy for the first time:**
1. Go to vercel.com and sign in with GitHub
2. Click "New Project" → import `dbhs-lost-and-found`
3. Under "Environment Variables," add:
   - `VITE_SUPABASE_URL` → your Supabase project URL (no `/rest/v1/` at the end)
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
4. Click Deploy
5. Vercel gives you a URL like `dbhs-lost-and-found.vercel.app`

---

## 3. How to Add a Teacher Account

Current authorized users: music teachers and student presidents (~5 people total). The head band director manages these accounts as admin.

**Steps:**
1. Log into the website as admin
2. Go to Admin Panel → Teachers tab
3. Enter the teacher's real email address and a temporary password
4. Click "Add teacher"
5. The teacher receives a confirmation email — they must click the link before they can log in
6. Share the temporary password with them — they can change it later via Supabase if needed

**Note:** Any real email address is accepted — there is no domain restriction, since staff include both `@wvusd.org` and `@stu.wvusd.org` accounts.

---

## 4. How to Remove a Teacher Account (Two-Step Process)

⚠️ This is a two-step process. Skipping step 2 means the person can still log in.

**Step 1 — Remove from Admin Panel**
1. Log into the website as admin
2. Go to Admin Panel → Teachers tab
3. Click "Remove" next to the teacher's name
4. Confirm the popup
5. Their profile and role are deleted — they no longer appear in the system

**Step 2 — Delete their login credentials**
1. Go to supabase.com → your project → Authentication → Users
2. Find the teacher's email
3. Click on their account → Delete user
4. Confirm deletion

After both steps, the person cannot log in at all.

**Why two steps?** The Admin panel only deletes the teacher's role record. The actual login account lives in Supabase Auth, which requires admin-level API access to delete — for security reasons, this can't be done from the frontend website directly.

---

## 5. How to Manage Admin Accounts

**Promoting a teacher to admin:**
1. Log in as admin → Admin Panel → Teachers tab
2. Click "Promote to admin" next to the teacher
3. They immediately gain admin access on their next login

**Demoting an admin back to teacher:**
1. Log in as admin → Admin Panel → Teachers tab
2. Click "Demote to teacher" next to the admin
3. They lose admin access immediately

**Important rules:**
- Any admin can promote any teacher to admin
- Any admin can demote any other admin back to teacher
- No admin can demote themselves (the button simply doesn't appear on your own account)
- Always ensure at least one admin account exists at all times

---

## 6. How to Transfer Admin Access to a New Person

When the IT intern leaves or the band director changes, follow these steps:

**Step 1 — Create the new admin's account**
Either add them through the Admin panel (if they don't have an account yet), or if they already have a teacher account, go directly to step 2.

**Step 2 — Promote them to admin**
Log in as admin → Admin Panel → Teachers tab → click "Promote to admin" next to their account.

**Step 3 — Remove the old admin's access**
The outgoing admin should either be demoted to teacher (Admin Panel → Demote) or fully removed (two-step process in section 4).

**Step 4 — Transfer GitHub access**
Go to `github.com/albusshih-sketch/dbhs-lost-and-found` → Settings → Collaborators → Add the new person's GitHub account.

**Step 5 — Transfer Vercel access**
Go to vercel.com → Project Settings → Members → Add the new person.

**Step 6 — Transfer Supabase access**
Go to supabase.com → your project → Settings → Team → Invite the new person with their email.

---

## 7. How to Bulk-Add Teachers (If Scope Expands)

If the project ever expands beyond the music department to the full school (~100 teachers), manual account creation becomes impractical. Two options:

**Option A — CSV Bulk Invite**
Write a script that reads a spreadsheet of teacher emails and calls `supabase.auth.admin.inviteUserByEmail()` for each one. Each teacher receives an email with a link to set their own password. Requires using the Supabase service role key server-side (never in frontend code).
Estimated build time: 1–2 days.

**Option B — Google SSO (see section 8)**
Teachers log in with their existing school Google accounts. No passwords, no manual account creation.

---

## 8. How to Add Google Sign-In (SSO)

If the school confirms that all music staff use Google Workspace accounts (`@wvusd.org`), SSO is the cleanest long-term solution. Teachers click one button and they're in — no passwords to manage.

**Prerequisites:**
- Confirm all music teachers and student presidents have active `@wvusd.org` Google Workspace accounts
- Student presidents use `@stu.wvusd.org` — confirm whether these are also Google Workspace accounts
- Get Google OAuth credentials from school IT (Client ID and Client Secret)
- The authorized redirect URI to give them: `https://[your-supabase-project-id].supabase.co/auth/v1/callback`

**Setup steps:**
1. Go to Supabase Dashboard → Authentication → Providers → Google → Enable
2. Enter the Client ID and Client Secret provided by school IT
3. To restrict to school domain only, add `@wvusd.org` as an allowed domain
4. Update `LoginPage.jsx` to show a "Sign in with Google" button instead of email/password form
5. The existing trigger automatically creates profiles for new users on first login

**Impact on existing workflow:**
- Teachers no longer need to be manually added — any authorized Google account can log in automatically
- The "Add teacher" form in the Admin panel becomes a fallback for edge cases only
- Admin still needs to manually promote someone to admin role after their first login

---

## 9. How to Improve the UI

The current UI uses plain inline CSS — functional but minimal. To make it look more polished:

**Option A — Tailwind CSS**
Add utility classes directly to HTML elements instead of writing custom CSS.
```bash
npm install tailwindcss @tailwindcss/vite
```
Then replace inline styles in each component with Tailwind classes.

**Option B — shadcn/ui**
Pre-built, beautifully designed React components (buttons, cards, forms, modals). Copy components you need directly into your project.
Visit: ui.shadcn.com

**Recommendation:** Do the UI refresh after the site is deployed and confirmed working. Changing styling touches almost every file — easier to do on a stable foundation.
Estimated build time for a full UI refresh: 2–3 days.

---

## 10. How to Add Mobile App Support (PWA)

The website already works in mobile browsers. To make it feel more like a native app (icon on home screen, etc.):

```bash
npm install vite-plugin-pwa
```

Update `vite.config.js` to include the PWA plugin with your app name and icons. Teachers can then tap Share → "Add to Home Screen" on their phone. It appears as an app icon and opens without the browser address bar, making photo uploads feel more natural.

Estimated build time: half a day.

---

## 11. Common Issues and Fixes

**"Could not load items" on the browse page**
- Press F12 → Console tab for the actual error
- Most likely cause: Supabase URL has `/rest/v1/` at the end in `.env`
- Fix: remove `/rest/v1/` — the Supabase library adds this automatically

**"No items posted yet" on dashboard even though items exist in Supabase**
- Cause: missing RLS SELECT policy for authenticated users on the items table
- Fix: Supabase SQL Editor → New query → run:
```sql
create policy "Authenticated users can view items"
on items for select to authenticated using (true);
```

**Teacher removed from Admin panel but can still log in**
- Cause: removing from Admin panel only deletes the profile row, not the Auth account
- Fix: complete step 2 of the two-step removal process (Supabase Dashboard → Authentication → Users → Delete)

**Promote/demote button not working**
- Cause: missing UPDATE policy on profiles table
- Fix: Supabase SQL Editor → New query → run:
```sql
create policy "Admin can update profiles"
on profiles for update to authenticated using (true) with check (true);
```

**Teacher can't log in after account was created**
- Cause: email not confirmed — Supabase sends a confirmation email that must be clicked
- Fix: Supabase Dashboard → Authentication → Users → find user → manually confirm email

**Site works locally but not after deployment**
- Cause: environment variables not set in Vercel
- Fix: Vercel → Project → Settings → Environment Variables → add both Supabase keys

**Changes pushed to GitHub but live site didn't update**
- Go to vercel.com → your project → Deployments tab
- Check if the latest deployment failed — click it to see the error log

**Admin panel shows blank or redirects to home**
- Cause: user's profile row doesn't exist or role isn't set to 'admin'
- Fix: Supabase Dashboard → Table Editor → profiles → find the user's row → set role to 'admin'

---

## 12. How to Back Up the Database

**Manual export (free plan):**
Supabase Dashboard → Table Editor → items table → export button (CSV format).

**Full database backup:**
Supabase Dashboard → Settings → Database → Backups.

**Automatic daily backups:**
Available on Supabase Pro plan ($25/month). Recommended if this project scales beyond the music department.

---

## 13. Future Features to Consider

- **Item status (claimed/unclaimed):** Add a `status` column and let teachers mark items as claimed rather than deleting them, preserving a history of found items.
- **Edge Function for teacher deletion:** A secure server-side Supabase function that deletes both the profile and Auth account in one step from the Admin panel, eliminating the two-step manual process.
- **Email notifications:** When an item is posted, automatically notify subscribed students via email using Supabase Edge Functions + a mailing service like Resend.
- **Item categories:** Add a category dropdown (Brass, Woodwind, Percussion, Strings, Accessories, Other) to make browsing easier for music students.
- **SSO / Google Sign-In:** Allow teachers to log in with their school Google accounts — no passwords to manage.
- **Dark mode:** A simple CSS variable swap — low effort, high impact.
- **PWA support:** Makes the site feel like a native app on mobile — important for teachers uploading photos from their phones.
- **Analytics:** Show the admin how many items are posted per month, average time before removal, most common item types.

---

*This document should be updated whenever significant changes are made to the project.*  
*Last updated: June 2026*
