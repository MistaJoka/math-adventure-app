# Math Learning App — Starter Pack

A lightweight, **drop‑in web app** for ages **9–12** to practice math through games and activities.
No build tools required — just open `index.html` or upload the folder to your site (e.g., `wmbmartialarts.com/testpage-math/`).

## What's inside
- `index.html` – the page shell and layout
- `styles.css` – Tailwind‑like utility-lite CSS (no external deps)
- `app.js` – logic, routing, localStorage, and game engine
- `data/problems.json` – grade‑appropriate problems (mix of +, −, ×, ÷, word problems)
- `assets/` – SVG icons used by the UI
- `embed.html` – ready-to-copy snippet for embedding in an existing page via `<iframe>`
- `README.md` – this file

## Quick start
1. Double‑click `index.html` to try locally.
2. Upload the folder to your website hosting.
3. Or embed using `embed.html` (copy the `<iframe>` snippet into an existing page).

## Customize
- Edit `data/problems.json` to change problem sets.
- In `app.js`, tweak `UNLOCK_TARGET` to adjust how many correct answers unlock the mini‑game.
- Replace SVGs in `assets/` if you want different icons/colors.

## Notes for deployment on wmbmartialarts.com
- Place the folder at `/testpage-math/` (e.g., `https://wmbmartialarts.com/testpage-math/`).
- If you cannot add a full page, open `embed.html`, set the `src` to the hosted path to `index.html`, and paste the iframe into an existing test page (like `testpage2`).

(c) 2025 — MIT License
