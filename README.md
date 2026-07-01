# Waveform_Forge
Waveform Forge is the team’s central operations hub for tracking equipment, managing projects, delivering training, and sharing our mission. It supports the programmers and engineers who design, develop, and refine waveform solutions for adversary communication signal environments.

> **Data handling rule:** This site and its backend run on commercial cloud
> services (GitHub Pages, Firebase). Post **public / fully releasable**
> information only. Do **not** store controlled (CUI/FOUO), export-controlled
> (ITAR/EAR), classified, or operational data here. If that requirement ever
> changes, stop and re-architect — this stack is not authorized for it.

---

## Tech stack (Phase 0)

| Layer       | Choice                                            |
| ----------- | ------------------------------------------------- |
| Frontend    | React 18 + TypeScript + Vite                      |
| Styling     | Tailwind CSS                                       |
| Routing     | React Router                                       |
| Backend     | Firebase (Auth + Firestore) — wired, used Phase 1 |
| Hosting     | GitHub Pages (static SPA)                          |
| CI/CD       | GitHub Actions                                     |
| Dev env     | GitHub Codespaces / Dev Container                  |

## Project structure

```
.devcontainer/devcontainer.json   Codespaces config (Node 22, extensions, npm install)
.github/workflows/deploy.yml       Build + deploy to GitHub Pages
public/favicon.svg                 Site icon
src/
  main.tsx                         App entry (Router basename = repo path)
  App.tsx                          Route table
  index.css                        Tailwind entry + base styles
  lib/firebase.ts                  Firebase client init (config from env)
  components/layout/               Header, Footer, Layout shell
  routes/public/                   Home, About (synopsis), NotFound
firestore.rules                    Firestore security rules (Phase 0: deny-all)
firebase.json / firestore.indexes.json
.env.example                       Template for Firebase web config
vite.config.ts                     base = "/Waveform_Forge/"
```

---

## Run locally (in your Codespace)

```bash
npm install      # already run automatically on Codespace create
npm run dev      # starts Vite on port 5173 (auto-forwarded preview)
```

The public Home and About pages work **without** Firebase configured. You only
need the `.env` values once Phase 1 (login) is added — but you can set them now.

Other scripts: `npm run build` (production build), `npm run preview`
(serve the build), `npm run lint`, `npm run format`.

---

## What YOU need to do (step by step)

These are the manual, one-time setup tasks that can’t be done from code.

### A. Create the Firebase project

1. Go to <https://console.firebase.google.com> and click **Add project**.
2. Name it (e.g. `waveform-forge`). Google Analytics is optional — you can
   disable it.
3. In the left sidebar, open **Build → Authentication → Get started**, then
   under **Sign-in method** enable **Email/Password**. (Approval/roles come in
   Phase 1; just enable the provider now.)
4. Open **Build → Firestore Database → Create database**. Choose **Production
   mode** (locked rules — that’s what we want) and pick a region close to your
   team.
5. Register a **Web app**: click the **gear icon → Project settings →
   General → Your apps → Web (`</>`)**. Give it a nickname. Firebase shows a
   `firebaseConfig` object — keep that screen open for the next step.

### B. Configure local environment

1. In the repo, copy the template:
   ```bash
   cp .env.example .env
   ```
2. Fill `.env` with the values from the `firebaseConfig` object:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`

   `.env` is git-ignored, so it never gets committed. (These values are not
   true secrets — Firebase serves them to the browser — but keeping them out of
   git keeps the repo clean and easy to rotate.)

### C. Enable GitHub Pages

1. On GitHub: **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
   (Do not pick the “Deploy from a branch” option.)

### D. Add the build secrets on GitHub

The deploy workflow injects your Firebase config at build time from repository
secrets.

1. On GitHub: **Settings → Secrets and variables → Actions → New repository
   secret**.
2. Add each of these (same values as your `.env`):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

### E. Authorize the Pages domain in Firebase (needed for Phase 1 login)

1. Firebase Console → **Authentication → Settings → Authorized domains →
   Add domain**.
2. Add `ashtongn.github.io` (your GitHub Pages host). Required before
   email/password login will work on the live site.

### F. Deploy

1. Commit and push to `main`:
   ```bash
   git add -A
   git commit -m "Phase 0: scaffold Waveform Forge"
   git push origin main
   ```
2. Watch the **Actions** tab. When the “Deploy to GitHub Pages” workflow
   finishes, your site is live at:

   **https://ashtongn.github.io/Waveform_Forge/**

> If you ever rename the repository, update `base` in `vite.config.ts`, the
> `favicon` paths in `index.html`, and the Pages URL above to match.

---

## Deploying the Firestore rules (optional, recommended)

The deny-all `firestore.rules` matches what you set in the console (Production
mode). To manage rules from this repo instead of the console:

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # select your project, give it an alias like "default"
firebase deploy --only firestore:rules
```

---

## Roadmap

- **Phase 0 (done):** Scaffold, public About/Home, Firebase wired, CI/CD to Pages.
- **Phase 1:** Email/password auth, access-request → admin approval, roles
  (`admin` / `member`), route guards, real Firestore rules.
- **Phase 2:** Equipment tracking (inventory + check-in/out).
- **Phase 3:** Real-time Kanban boards.
- **Phase 4:** Training lessons (static → video → quizzes).
- **Phase 5:** Audit log, backups/export, additional roles, future modules.
