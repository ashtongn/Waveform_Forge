# Changelog

All notable changes to Waveform Forge are recorded here. Newest first.

The version number lives in `package.json`. This project uses simple semantic
versioning while pre-1.0: feature releases bump the **minor** number, small
fixes bump the **patch** number.

---

## v0.2.0 — Phase 1: Authentication & Admin Approval

**Pushed:** 2026-07-01

First functional release beyond the Phase 0 scaffold. Adds a complete
sign-up → admin-approval → member-access flow, enforced by Firestore Security
Rules (free Spark plan — no backend, no Cloud Functions).

### Added
- **Auth context** (`src/auth/`): `AuthProvider` tracks Firebase Auth and
  live-subscribes to the signed-in user's `/profiles/{uid}` document, exposing
  `{ user, profile, loading }` via the `useAuth()` hook.
- **Sign-up & login pages** (`/signup`, `/login`): email/password auth. Sign-up
  creates a `/profiles/{uid}` document as `member` / `pending`.
- **Account-status screen**: shown to signed-in but unapproved users. Denied
  users can re-request review (moves them back to `pending`).
- **Route guards**: `RequireApproved` (member routes) and `RequireAdmin` (admin
  routes), plus a shared `LoadingScreen` to prevent redirect flashes.
- **Protected routes**: `/app` (approved members) and `/admin` (admin only),
  currently backed by placeholder landing pages for future features.
- **Admin approval queue** (`/admin`): real-time list of sign-ups with
  Approve / Deny actions; approving a user updates their session instantly.
- **Auth-aware navigation**: the header now shows Sign in / Sign out and
  conditional Members / Admin links; the Home page "Team sign-in" button is now
  live (previously a static placeholder).
- **Docs**: `docs/DEV_LOG.md` development log covering Phase 0 and Phase 1.

### Changed
- **Firestore rules** (`firestore.rules`): replaced deny-all with the
  `profiles` model. Admin authority is anchored to a hard-coded admin UID (not a
  forgeable field). Users may create only their own pending profile; only the
  admin may approve/deny; denied users may re-request.
- **Version**: `0.1.0` → `0.2.0`.

### Deployment notes
- The Firebase web config is now bundled into the build (the auth code imports
  `src/lib/firebase.ts` for the first time). The six `VITE_FIREBASE_*` GitHub
  Actions secrets are injected automatically by the Pages workflow.
- Firestore rules are deployed separately via the Firebase Console (or
  `firebase deploy --only firestore:rules`) — they do not ship with the site.

---

## v0.1.0 — Phase 0: Scaffold & Deployment

- React 18 + TypeScript + Vite 6 + Tailwind + React Router SPA.
- Firebase project wired (Auth + Firestore, deny-all rules).
- GitHub Pages CI/CD via `.github/workflows/deploy.yml` with SPA 404 fallback.
- Public Home and About pages.
- Live at https://ashtongn.github.io/Waveform_Forge/
