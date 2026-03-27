# Master Tracker

Production task and budget tracker for the Marsh McLennan Agency / Third Horizon engagement. Built with React, TypeScript, Vite, and Tailwind CSS.

**Live:** [thtopher.github.io/mma-tracker](https://thtopher.github.io/mma-tracker/)

## Features

- **Task Board** — drag-and-drop Spotlight grid with auto-scored card placement and manual promote/demote between Spotlight and Roster
- **Budget Views** — Schedule E (Data Enhancements) and Schedule F (Data Innovation) with monthly burn charts and pool balance tracking
- **Project Detail** — RACI assignments, tasks, notes, links, and full metadata per project
- **Priority & Status Badges** — clickable priority cycling, MMA workflow statuses, contract references, version tags
- **Freshness Indicators** — visual activity dots based on last update recency
- **Import/Export** — JSON backup and restore via localStorage

## Branding

Colors, fonts, and logos are extracted from the official MMA slide template:

- **Palette:** MMA dark blue (`#002C77`), blue (`#009DE0`), turquoise (`#00968F`), orange (`#FF8C00`), purple (`#8246AF`), and more — defined as custom Tailwind theme tokens in `src/index.css`
- **Font:** Arial
- **Logos:** Marsh McLennan Agency + Third Horizon

## Development

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build
```

Deploys automatically to GitHub Pages on push to `main` via `.github/workflows/deploy.yml`.

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- @dnd-kit (drag and drop)
- Recharts (data visualization)
- Lucide React (icons)
# MMA Tracker — ds016683 fork
