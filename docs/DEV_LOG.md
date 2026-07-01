# Waveform Forge — Development Log

A running record of what has been built and configured, so anyone (including
future-you) can understand the project's history without re-reading every diff.

Most recent work is at the top.

---

## Phase 1 — Authentication & Admin Approval (complete — v0.2.0)

Goal: non-members see only the public Home/About pages; people can sign up but
land in a "pending" state; the admin (you) reviews and approves sign-ups;
approved members get access to member-only pages as they are built.

Architecture: **free Spark plan** — everything runs in the browser (React) or in
**Firestore Security Rules**. No backend server, no Cloud Functions, no custom
claims.

### Data model
Firestore collection `profiles/{uid}`:

| Field       | Type                                   | Notes                                   |
| ----------- | -------------------------------------- | --------------------------------------- |
| `email`     | string                                 | Matches the user's Auth email           |
| `role`      | `'member'` \| `'admin'`                | Display/UI only — NOT the security gate |
| `status`    | `'pending'` \| `'approved'` \| `'denied'` | Access state                         |
| `createdAt` | timestamp                              | Set on sign-up via `serverTimestamp()`  |

**Where admin power actually comes from:** a single hard-coded UID inside
`firestore.rules` (`adminUid()`). The `role` field is only used by the UI. Even
if someone forged `role: 'admin'` in their own document, the rules would still
deny admin actions because their UID would not match. The rules also prevent a
user from changing their own `role`/`status` in the first place.

### Step 1 — Auth context & Firebase wiring (done)
New `src/auth/` folder:
- `types.ts` — `Profile`, `UserRole`, `UserStatus` types.
- `AuthContext.ts` — React context holding `{ user, profile, loading }`.
- `AuthProvider.tsx` — tracks Firebase Auth via `onAuthStateChanged`, and
  live-subscribes to `/profiles/{uid}` via `onSnapshot` so approval/denial is
  reflected instantly (no reload). `loading` stays true until the initial auth
  state — and the first profile snapshot, if signed in — resolves, so route
  guards never "flash" a wrong redirect.
- `useAuth.ts` — `useAuth()` hook (throws if used outside the provider).

Wired `<AuthProvider>` around `<App />` in `src/main.tsx` (inside
`BrowserRouter`).

> Side effect: this is the first code to import `src/lib/firebase.ts`, so
> Firebase now ships in the JS bundle (bundle size grew accordingly, and Vite
> warns it is >500 KB — expected, not an error). Your `VITE_FIREBASE_*` config
> now gets baked into the build automatically on the next push to `main`.

### Step 2 — Login & Sign-up pages (done)
- `src/auth/actions.ts` — `signUp` (creates the Auth account **and** the
  `/profiles/{uid}` doc as `member` / `pending`), `logIn`, `logOut`, and
  `requestReapproval` (moves a `denied` profile back to `pending`).
- `src/auth/errors.ts` — `authErrorMessage()` maps Firebase error codes to
  friendly text; never leaks raw internals.
- `src/routes/auth/Login.tsx` — email/password sign-in.
- `src/routes/auth/SignUp.tsx` — "Request access" form with password confirm.
- `src/App.tsx` — added public `/login` and `/signup` routes.

These pages are reachable by URL only for now; a header "Sign in" link comes in
step 6 so we don't expose a half-wired flow.

### Step 3 — Firestore rules & admin bootstrap (in progress)
- Rewrote `firestore.rules` from deny-all to the `profiles` model:
  - Users may **read** only their own profile; the admin may read all (for the
    approval queue).
  - Users may **create** only their own profile, and only as `member` /
    `pending`, with an email matching their Auth token.
  - **Updates:** the admin (by UID) may change anything; a `denied` user may
    move only their own `status` back to `pending` (re-request) and nothing
    else.
  - **Delete:** admin only.
  - Everything outside `profiles` stays denied until those collections exist.
- Admin bootstrap (manual, one time) — see the checklist below.

**Remaining for step 3:** your UID (`Ni6g9PNFC2Yiejz7e8NR2P0kpBA3`) is now
hard-coded in `adminUid()`. Left to do: promote your own profile to
`role: admin` / `status: approved`, then **re-publish** the rules so the UID
takes effect.

### Step 4 — Route guards & pending-approval screen (done)
- `src/components/LoadingScreen.tsx` — centered spinner shown while auth state
  resolves, so guards never flash a wrong redirect.
- `src/routes/auth/AccountStatus.tsx` — shown to signed-in but unapproved users.
  Pending users see "awaiting approval"; denied users get a "Request review
  again" button (calls `requestReapproval`). Both can sign out.
- `src/routes/RequireApproved.tsx` — guard for member routes. Signed-out →
  `/login` (remembering the target); signed-in but not approved → the account
  status screen; approved → renders the nested route via `<Outlet />`.
- `src/routes/RequireAdmin.tsx` — guard for admin routes. Signed-out → `/login`;
  non-admin → `/404` (so admin routes aren't advertised); admin → `<Outlet />`.
- `src/routes/member/MemberHome.tsx` — placeholder landing for approved members
  at `/app`.
- `src/routes/admin/AdminHome.tsx` — placeholder at `/admin` (replaced by the
  real approval queue in step 5); exists so `RequireAdmin` has something to
  protect.
- `src/App.tsx` — added the two guarded route groups (`/app` behind
  `RequireApproved`, `/admin` behind `RequireAdmin`).
- `Login.tsx` now returns the user to the page a guard redirected them from
  (via `location.state.from`), else `/app`. `SignUp.tsx` routes to `/app` so a
  new (pending) user immediately sees the awaiting-approval screen.

### Step 5 — Admin approval queue (done)
- `src/auth/admin.ts` — `subscribeToProfiles()` live-subscribes to the whole
  `profiles` collection (newest first; admin-only per the rules) and
  `setProfileStatus()` performs the admin-only status update.
- `src/routes/admin/AdminHome.tsx` — replaced the placeholder with the real
  queue at `/admin`:
  - **Pending** section lists new sign-ups with **Approve** / **Deny** buttons.
  - **All accounts** section shows every other profile with a status badge
    (and an `admin` badge), plus contextual Approve/Deny actions.
  - Updates are real-time (`onSnapshot`), so approving someone here instantly
    flips their session via the `AuthProvider` profile listener.
  - The admin's own row and any `admin` role row show no action buttons, so you
    can't accidentally lock yourself out.

### Step 6 — Header & Home auth wiring (done)
- `src/components/layout/Header.tsx` — now auth-aware via `useAuth()`:
  - Always shows Home / About.
  - Shows **Members** (`/app`) when the user is approved.
  - Shows **Admin** (`/admin`) when the user's role is admin.
  - Shows **Sign out** when signed in, otherwise **Sign in** (`/login`).
  - Auth controls are hidden until `loading` resolves to avoid a flash of the
    wrong control.
- `src/routes/public/Home.tsx` — replaced the static "Team sign-in — coming
  soon" placeholder with a real button: approved users get "Go to member area"
  (`/app`); signed-out users get "Team sign-in" (`/login`); signed-in but
  unapproved users go to `/app` (which shows the awaiting-approval screen).

### Phase 1 status: COMPLETE (v0.2.0)
Steps 1–6 are done and pushed. The full sign-up → approval → member-access flow
works end to end and is enforced by Firestore rules. Step 7 ("more protected
pages") is intentionally deferred — those member features don't exist yet. The
auth foundation is ready for them (see the guide below).

---

## How to add a new protected feature (do this for each future feature)

The auth system is designed so new member features slot in without touching the
core. When you build a feature like equipment tracking, kanban, or training:

### 1. Add the page and route
- Create the page under `src/routes/member/` (e.g. `Equipment.tsx`).
- Mount it inside the existing `RequireApproved` group in `src/App.tsx`:
  ```tsx
  <Route element={<RequireApproved />}>
    <Route path="app" element={<MemberHome />} />
    <Route path="app/equipment" element={<Equipment />} />  {/* new */}
  </Route>
  ```
- Admin-only screens go inside the `RequireAdmin` group instead.

### 2. Add navigation (optional)
- Add a `NavLink` in `src/components/layout/Header.tsx` (gate it with
  `isApproved` / `isAdmin` as appropriate), or link from `MemberHome`.

### 3. Add the Firestore collection + rules (the important part)
- Add a new `match` block in `firestore.rules` ABOVE the final catch-all
  `match /{document=**} { allow read, write: if false; }`.
- Use the existing helpers — do NOT re-implement auth logic:
  ```
  match /equipment/{id} {
    allow read: if isApproved();
    allow create, update: if isApproved();
    allow delete: if isAdmin();   // or isApproved(), depending on the feature
  }
  ```
- **Redeploy the rules** after every change (Firebase Console → Firestore →
  Rules → Publish, or `firebase deploy --only firestore:rules`). Rules are NOT
  shipped by the Pages workflow — this is the easiest step to forget.

### 4. Consider Firestore indexes
- Simple single-field queries need no index. Compound queries (e.g. filter +
  order-by on different fields) will make Firestore throw an error with a link
  to auto-create the index; add it to `firestore.indexes.json` too so it's in
  source control.

### Things to keep in mind
- **Rules are the real security boundary.** Client-side guards
  (`RequireApproved` / `RequireAdmin`) are UX only. Every collection MUST have a
  matching rule; anything without an explicit rule is denied by the catch-all,
  which is the safe default.
- **Admin authority = the hard-coded UID** in `adminUid()`, not the `role`
  field. If the admin ever changes (new person, new account), update that UID
  and redeploy the rules.
- **`isApproved()` does a `get()` per evaluation**, which counts as a document
  read. Fine at team scale; if the app grows large, consider caching approval
  via custom claims (requires upgrading to the paid Blaze plan + a Cloud
  Function).
- **Bundle size**: Firebase makes the JS bundle >500 kB (Vite warns). If load
  time matters later, code-split Firebase / member routes with dynamic
  `import()`. Not urgent.
- **New env vars**: none needed for the current design. If a feature ever needs
  a new build-time variable, add it to `.env`, `.env.example`, the
  `vite-env.d.ts` typings, AND the GitHub Actions secrets + `deploy.yml`.
- **Update the docs**: add a step entry here and a `CHANGELOG.md` entry with a
  version bump for each meaningful release.

---

## Phase 0 — Project setup & deployment (done earlier)

- **Stack:** React 18 + TypeScript, Vite 6, React Router v6, Tailwind CSS,
  Firebase (Auth + Firestore). Hosted as a static SPA on GitHub Pages.
- **Firebase project** `waveform-forge` created; Email/Password auth enabled;
  Firestore created in production mode (locked rules).
- **Local env:** `.env` (git-ignored) holds the six `VITE_FIREBASE_*` web config
  values, copied from `.env.example`. These are not true secrets (Firebase ships
  them to the browser) but are kept out of git for cleanliness.
- **GitHub Pages:** `.github/workflows/deploy.yml` builds the app and deploys to
  Pages on every push to `main`, injecting the six `VITE_FIREBASE_*` values from
  repository secrets at build time. A `404.html` copy of `index.html` provides
  SPA deep-link fallback. `base: '/Waveform_Forge/'` in `vite.config.ts` matches
  the Pages sub-path.
- **Secrets:** all six `VITE_FIREBASE_*` values added as GitHub Actions
  repository secrets.
- **Repo visibility:** made **public** so free GitHub Pages will serve the site.
- **Firebase authorized domain:** `ashtongn.github.io` added, required for login
  on the live site.
- **Live site:** https://ashtongn.github.io/Waveform_Forge/

---

## Admin bootstrap checklist (do once, for step 3)

1. **Deploy the new rules.** Firebase Console → **Firestore Database → Rules**,
   paste the contents of `firestore.rules`, click **Publish**. (Or, with the
   Firebase CLI: `firebase deploy --only firestore:rules`.)
2. **Create your admin account.** On the site (or `npm run dev` locally), go to
   `/signup` and register with your email/password. This creates your Auth
   account and a `pending` profile.
3. **Copy your UID.** Firebase Console → **Authentication → Users** → copy the
   User UID for your account.
4. **Hard-code the UID.** In `firestore.rules`, replace
   `REPLACE_WITH_ADMIN_UID` in `adminUid()` with your UID.
5. **Promote your profile.** Firebase Console → **Firestore Database → Data →
   `profiles` → your UID doc** → set `role` to `admin` and `status` to
   `approved`.
6. **Redeploy the rules** (repeat step 1) so `adminUid()` takes effect.

After this, your account is the admin, and the security rules recognize you by
UID regardless of what any `role` field says.
