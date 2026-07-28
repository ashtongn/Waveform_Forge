# Changelog

All notable changes to Waveform Forge are recorded here. Newest first.

The version number lives in `package.json`. This project uses simple semantic
versioning while pre-1.0: feature releases bump the **minor** number, small
fixes bump the **patch** number.

---

## v0.5.0 — Collaborative Document Editing

**Pushed:** 2026-07-28

Approved members can now revise the training plan from the site, not just
comment on it. The document is split at its top-level headings and each section
is edited on its own, so two people can work on different chapters at the same
time and a save rewrites one small record instead of several hundred pages.

### Added
- **Section editing.** Hovering a section reveals an Edit control for approved
  members; it swaps that section for a Markdown source editor with a live
  preview toggle. Saves publish instantly to every reader through the existing
  live subscription. Drafts are mirrored to `localStorage`, so a dropped
  connection does not lose work.
- **`DocumentSourceRepository`** — the document body now sits behind the same
  kind of storage seam as comments, with a Firestore implementation storing one
  record per section under `docSources/{documentId}/sections/{sectionId}`.
- **Repository fallback.** Until a document is imported — or if the reader is
  offline, or the rules deny the read — the page renders the copy bundled from
  `/docs` as a read-only manual. A one-click **Enable editing** action performs
  the one-time import.
- **Export .md** in the version banner: downloads the current Markdown with its
  front matter re-attached, so a maintainer can commit it back to `/docs`.
- **Collaboration status bar.** The page now states plainly whether the reader
  is in review mode or read-only, and why. Previously an approved member and a
  signed-out visitor saw an identical page, with no way to tell why commenting
  "did not work".
- **`editDocument` / `importDocument`** permissions, routed through the existing
  `PermissionService`; `docSources` rules allow public read and approved-member
  writes, matching the shared Kanban and equipment collections.

### Changed
- Provenance in the version banner is derived from the live sections once a
  document is imported, and from front matter otherwise, so it always describes
  the copy actually on screen.
- `MarkdownRenderer` now renders a single section; the `.wf-doc` typography
  wrapper moved to `DocumentBody` so the grid and heading rhythm stay continuous.

### Notes
- Conflict handling is intentionally minimal: sections are independent, so
  collisions require two members editing the *same* section, where the last save
  wins. Locking and revision history were considered and deferred.
- Comment anchors survive edits through the existing quote + context resolver;
  anything that cannot be relocated is preserved and flagged "Detached".

---

## v0.4.0 — Living Documents & Anchored Comments

**Pushed:** 2026-07-28

The Training Lab now hosts living Markdown documents alongside the interactive
modules. `/docs/training_plan.md` is rendered directly as the Waveform
Development Flight Training Plan — the Markdown file remains the single source
of truth, edited outside the app and picked up automatically. Approved members
can highlight any passage and open a Google-Docs-style review thread against it.

### Added
- **Living document page** (`/docs/:docSlug`): three-pane engineering-manual
  layout — table of contents and search on the left, document centre, review
  comments on the right. Collapses to slide-out panels on tablet and mobile.
- **Living document registry** (`src/routes/docs/registry.ts`): add a Markdown
  file to `/docs` plus one registry entry to publish another document.
- **Anchored comments**: highlight text, add a comment, reply, edit, delete,
  resolve and reopen. Highlights stay visible in the document and clicking one
  focuses its thread.
- **Durable anchors** (`anchoring/anchor.ts`): W3C Web Annotation style quote +
  context + position selectors with fuzzy fallback, so comments survive edits to
  the Markdown. Unresolvable comments are preserved and flagged "Detached".
- **Unified search**: one query searches both the document body and the comment
  threads, with inline match highlighting and next/previous navigation.
- **Version banner**: version, last-updated and last-editor read from the
  document's YAML front matter.
- **`docComments` collection** with Firestore rules: public read,
  approved-member authoring, author-or-admin edit/delete.

### Changed
- **Training nav is now a single dropdown.** "Training" and "Training Plan" were
  crowding the top bar, so they collapse into one **Training** tab that expands
  to *Interactive Trainings* and *Training Plan*. The tab stays highlighted
  anywhere in the section, and the new reusable `NavDropdown` component keeps the
  header from growing as more training destinations are added.
- **Firestore rules recognise `role == 'admin'`.** Admin authority previously
  came only from the hard-coded bootstrap UID, while the application UI has
  always checked the profile's `role` field. The rules now accept either, so the
  two agree. Users still cannot promote themselves: profile creation forces
  `role: 'member'`, and the only self-update permitted is a denied → pending
  re-request that touches `status` alone.

### Fixed
- **Could not highlight a short passage.** `content-visibility: auto` on the
  document sections made Chromium expand a drag-selection to the entire element
  whenever any part of the subtree was in the skipped state. Removed; correct
  selection is a hard requirement for anchored comments.
- **Selection shading bled through the "Add comment" button.** The floating
  toolbar now renders through a portal on `document.body` in its own top-level
  stacking context, positions against the selection's first/last line box rather
  than its full bounding box, and flips below the selection when there is no
  headroom above.
- **Profile lookups could fail the whole rule expression.** `isApproved()`
  dereferenced a `get()` that returns null for a signed-in user with no profile
  document yet; guarded with `exists()`.
- **Creating a thread took two writes.** The root comment's id is now generated
  client-side and stored in a single `setDoc`, instead of an `addDoc` followed by
  a patch to record its own `threadId`.
- **Storage failures were unreadable or silent.** Firestore errors are mapped to
  actionable messages, and resolve/reopen/delete no longer discard their rejected
  promise.

### Notes
- Permission checks are centralized in `comments/permissions.ts`; unapproved and
  signed-out visitors get a clean read-only manual with no comment controls.
- Storage sits behind the `CommentRepository` interface — the Firestore
  implementation is injected in one place (`DocumentRoute.tsx`).
- **The rules in this repo are not live until published.** Deploy them from the
  Firebase Console: Firestore Database → Rules → paste `firestore.rules` →
  Publish. Skipping this step makes every `docComments` request fall through to
  the catch-all deny, which surfaces as "Missing or insufficient permissions".

---

## v0.3.0 — Training Lab Catalog

**Pushed:** 2026-07-14

The public Training tab is no longer a single page. It is now a catalog of
interactive, education-only trainings backed by a registry, so new trainings
can be added by dropping in a module and one registry entry — no routing
changes required. Ships with a second training alongside the existing jamming
visualization.

### Added
- **Training catalog** (`/training`): the new landing page for the Training
  tab. Lists every registered training as a card (icon, title, summary, tags,
  difficulty), with support for non-clickable "coming soon" teaser cards.
- **Training registry** (`registry.ts`): a single, typed source of truth
  describing each training (slug, title, summary, tags, difficulty, status, and
  a lazily-loaded component). Drives both the catalog and the detail router.
- **Signal Bits Lab** (`/training/bits`): a new interactive training that walks
  learners through how a receiver turns a raw digital frame into structured
  information — hover a bit to preview its field, click to pin it, or play a
  guided receive scan that steps through the frame field by field. Includes a
  receive-flow panel and a field guide. Illustrative and non-operational: all
  field names, order, lengths, and bit values are fictional examples.

### Changed
- **Training routing**: `/training` now nests an index (catalog) and a
  `/training/:slug` detail route; unknown slugs redirect back to the catalog.
  Each training is lazily loaded and code-split into its own chunk.
- **Training structure**: each training is now a self-contained module under
  `training/modules/<name>/`. The existing jamming visualization was moved into
  `modules/jamming/` and wrapped by `JammingModule` with no behavior change.
- **Shared training chrome** (`TrainingLayout`): detail pages share a breadcrumb,
  a "back to catalog" link, and the standard public-safety note, so modules only
  render their interactive content.
- **Version**: `0.2.2` → `0.3.0`.

---

## v0.2.2 — Home Page Signal

**Pushed:** 2026-07-01

A visual refresh for the public landing page: a large, animated
frequency-spectrum signal now spans the full width of the page above the title.

### Added
- **Frequency signal** (`FrequencySignal`): a full-width Canvas 2D
  spectrum-analyzer trace — a jagged noise floor with a few drifting peaks —
  rendered above the home page title. It is DPR-aware, resizes with the
  viewport, pauses its animation when scrolled off-screen, and falls back to a
  single static frame under `prefers-reduced-motion`. Decorative only
  (`aria-hidden`), with no real signal data.

### Changed
- **Layout**: `Layout` now takes an opt-in `bleed` prop that drops the
  max-width and horizontal padding for full-width pages; the home route uses it.
  All other pages are unchanged.
- **Home page**: restructured so the signal spans edge-to-edge while the title,
  description, CTAs, and module cards keep the standard reading column. The
  auth-aware calls to action are preserved.
- **Palette**: added a `forge.signal` accent color.
- **Version**: `0.2.1` → `0.2.2`.

---

## v0.2.1 — Equipment Tracker

**Pushed:** 2026-07-01

First member feature: a shared team equipment tracker, plus a wider app layout
to give data-dense pages room to breathe.

### Added
- **Equipment tracker** (`/app/equipment`, approved members only): add / edit /
  delete gear, per-person check-out and (partial) return, mark units in service
  and back to available, live search, status/category filters, sort, summary
  stat cards, and collapsible groups. Records live in a shared `equipment`
  Firestore collection; status and available/checked-out counts are derived,
  not stored.
- **Navigation**: an "Equipment" header link and a member-home card link into
  the tracker (both visible to approved members only).

### Changed
- **Layout width**: `Layout` now takes a `wide` prop. Signed-in app pages
  (`/app`, `/app/equipment`, `/admin`) render in a wide shell
  (`max-w-screen-2xl`) so tables no longer force horizontal scrolling; public
  and auth pages keep the standard `max-w-5xl` reading width. Header and footer
  share the active width so their edges stay aligned. New app pages inherit the
  wide shell automatically.
- **Equipment layout**: the add/edit form and inventory sit side by side (form
  is sticky on large screens), matching the reference workflow.
- **Version**: `0.2.0` → `0.2.1`.

### Firestore
- Adds one security-rules block for the `equipment` collection
  (`allow read, create, update, delete: if isApproved() || isAdmin()`). No
  indexes required (filtering/sorting is client-side). No new manual console
  steps for this release beyond publishing the rules.

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
