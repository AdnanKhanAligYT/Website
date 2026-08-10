# CLAUDE.md

This file guides Claude Code (and other AI assistants) when working in this repository.

## What this repository is

A raw cPanel/shared-hosting backup (imported wholesale — see commit `ae96bdf "Import
website source from cPanel backup"`), not a scaffolded project. There is no
`README.md`, no `package.json`, no framework, and no build step. It bundles several
independent, mostly-unrelated PHP/HTML mini-apps belonging to Mohammad Adnan:

- **`25/` and `26/`** — a school portal for **Saiema Mansoor Public School (SMPS)**,
  one folder per academic year (2025, 2026): per-class dashboards, attendance
  (with GPS geofencing), fees, results, syllabus, assembly/activity pages.
- **`study.html` + `setup.php` + `data/`** — a "Study Topic Manager" single-page app
  (mixed Hindi/Urdu/English UI) backed by flat JSON (`data/db.json` for
  courses/subjects, `data/topics/*.json`, one file per topic — ~413 files).
- **`vc.html`** — a WebRTC "Direct Call" app using PeerJS (loaded via CDN).
- **`my/`** — a standalone, Termux-hosted local document manager with its own
  `index.php`/`api.php`/`file.php` (see `my/README.txt`).
- **`upload.php`** — a generic root-level file-manager/browser script.
- **`Links.html`** — a personal resume/link-in-bio page.
- **`index.html`** — **not** the real homepage; it's a JS redirect stub forwarding to
  an external Google Apps Script URL.

Because these apps are independent, changes to one (e.g. `26/`) should not be assumed
to affect another (e.g. `study.html` or `my/`) — check which mini-app you're actually
in before reusing code or config across folders.

## Project structure

```
25/            Year-2025 school pages: per-class *.html, css/, js/, images/, json/ (content data)
26/            Year-2026 school pages + PHP admin/attendance endpoints, css/, images/, json/
data/          Study Topic Manager storage: db.json + topics/ (per-topic JSON files)
my/            Standalone Termux "document manager" mini-app (index.php, api.php, file.php, uploads/)
index.html     Root — JS redirect to an external Google Apps Script
Links.html     Personal resume/portfolio page
setup.php      Config manager for Study Topic Manager (writes data/config.json, data/logo.txt)
study.html     Study Topic Manager SPA (single HTML file, inline CSS/JS)
upload.php     Generic root-level file browser/uploader script
vc.html        WebRTC video-call page (PeerJS)
```

`25/` and `26/` mirror each other's structure almost exactly (parallel `css/`, `js/`,
`images/`, `json/` subfolders per year) — when fixing something in one year's folder,
check whether the same bug exists in the other year's copy.

## Tech stack

**Plain server-rendered PHP + static HTML/CSS/JS. No framework, no bundler, no package
manager.** Pages are mostly self-contained: inline `<style>` and inline `<script>`
tags rather than separate asset pipelines (see `26/smps.html`, `study.html`, `vc.html`,
`Links.html`). External libraries are loaded via CDN tags only — Font Awesome,
jsPDF + jspdf-autotable (`26/smps.html`), PeerJS (`vc.html`), Google Fonts
(Caveat/Syne/DM Sans/Noto Nastaliq Urdu). CSS is hand-written with CSS custom
properties for per-class/house theming (e.g. `26/css/class.css`, `25/css/light.css`)
— no Tailwind/SCSS/CSS modules. Backend PHP is plain procedural code (no Composer, no
framework, no ORM); state is stored in flat JSON files under `json/`/`data/`, not a
database.

## Routing

No router — file-based URL routing native to Apache/PHP hosting. Each `.html`/`.php`
file is directly addressable (e.g. `/26/smps.html`, `/26/Attendance.html`,
`/study.html`). PHP endpoints under `26/` (`get_attendance.php`, `save_attendance.php`,
`set_location.php`, `manage_teachers.php`, `verify_dashboard_password.php`) are simple
JSON APIs consumed by the corresponding HTML page's inline JS via `fetch`. The
convention for a new endpoint: `header('Content-Type: application/json')`, read/write
a sibling JSON file in `json/`, return `json_encode(...)`.

## Secrets / config

No `.env` files anywhere. Secrets are plaintext JSON files explicitly excluded via
`.gitignore`: `json/passwords.json`, `26/json/passwords.json`, `25/json/passwords.json`
— gitignore comments note these "contain a plaintext admin password generated at
runtime — never commit." Password checks go through `26/password_helper.php` (used by
`set_location.php`, `verify_dashboard_password.php`, `manage_teachers.php`,
`change_password.php`), which reads against these gitignored files — **never commit a
real `passwords.json`, and never hardcode a password to replace one.** Also gitignored:
`.DS_Store`, `Thumbs.db`. The Google Apps Script URL hardcoded in `index.html` is a
public deployment endpoint, not a credential — it does not need to be secreted.

## Build / dev / test / deploy

None of these exist — no CI, no test framework, no lint config, no deploy config file.
This repo is meant to be dropped directly onto PHP-capable shared hosting (cPanel) or
run locally with PHP's built-in server:

```
php -S 0.0.0.0:8080
```

(documented in `my/README.txt` for the `my/` mini-app; the same approach works for
any PHP file here). There is nothing to build — verify HTML/CSS/JS changes by opening
the page directly or via the built-in server, and verify PHP endpoints by hitting them
with `curl`/browser and checking the JSON response.

## Conventions

- Class-level pages are named after grade (`10th.html`, `11th.html`, ... `LKG.html`,
  `UKG.html`); keep this naming when adding a new class page.
- Images live per-year under `25/images/`, `26/images/`. `26/images/attendance/` is a
  working directory for uploaded attendance photos — treat it as runtime data, not a
  static asset to commit wholesale.
- UI text is intentionally mixed Hindi/English/Urdu, matching the target audience
  (Indian school + Hindi-medium study app) — preserve this rather than translating to
  English-only.
- Flat JSON files act as the de facto CMS/database (`data/db.json` + `data/topics/*`
  for Study Topic Manager, `26/json/attendance.json`, `26/json/config.json` for
  school GPS/time config, `26/json/Teachers.json`, `26/json/smps.json`) — when adding
  a feature that needs persistence, follow this same flat-JSON-file pattern rather
  than introducing a database dependency this hosting environment doesn't have.

## Git conventions

Commit subjects use imperative mood with a short subject line, followed by a detailed
multi-paragraph body explaining **why** a change was made (not just what) — e.g.
explaining which files were dead code and why they were removed. This repo has
already been cleaned up once by a prior Claude Code session (deduplicating root-level
page copies into `26/`) — check for similar duplication before adding new pages, and
write commit messages in the same explain-the-why style.
