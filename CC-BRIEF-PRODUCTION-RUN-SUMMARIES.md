# Claude Code Build Brief
## Feature: Production Run Summaries — MMA Tracker Platform
**Date:** June 9, 2026  
**Repo:** `ds016683/mma-tracker` (already cloned at working directory)  
**Deploy target:** GitHub Pages → `https://ds016683.github.io/mma-tracker/`  
**Deploy command:** `npm run deploy` (uses gh-pages)

---

## Context

This is a React + TypeScript + Vite app deployed to GitHub Pages. The nav drawer (`src/components/navigation/AppDrawer.tsx`) groups views into collapsible categories. We're making **three nav changes** and building **one new feature view**.

---

## Nav Changes (AppDrawer.tsx + App.tsx)

### 1. Create a new nav category: "Collateral"
Place it **directly above "Joint Project Work"** in `NAV_GROUPS`. It should contain:
- **Data Intelligence** (moved from "Network Navigator Deployment" — `id: 'data-intelligence'`, icon: `FlaskConical`)
- **Production Run Summaries** (new — `id: 'production-run-summaries'`, icon: `TableProperties` from lucide-react)

### 2. Remove Data Intelligence from "Network Navigator Deployment"
That group keeps only Reporting Queries. Leave the group label as-is.

### 3. Wire the new view in App.tsx
- Add `'production-run-summaries'` to the `AppView` union type
- Import `ProductionRunSummariesView` from `./components/starset/ProductionRunSummariesView`
- Add `{activeView === 'production-run-summaries' && <ProductionRunSummariesView />}` to the render block

---

## The Primary Build: ProductionRunSummariesView

### What this is
Peter Schultz (MMA's data lead) needs an interactive interface to QA production run data comparing v8.2 (prior cycle) to v9 (current pre-production). The **primary view** is a **state × carrier stoplight matrix** — exactly like a spreadsheet grid where:
- Rows = US states (ordered by population rank, see below)
- Columns = 4 anchor carriers
- Each cell = color-coded quality label badge(s)

### Data source
**Static CSV** already placed at: `public/data/production-run-v9-comparison.csv`

This is a BigQuery export from `starset-analytics-national.analyst_testing_tables.state_review_comparison_v8_2_vs_preprod_v9_DEV4`. Fetch it at runtime with `fetch('/mma-tracker/data/production-run-v9-comparison.csv')` and parse with a simple CSV parser (no Papa Parse — write a lightweight one or use the existing pattern in the codebase).

**Key columns:**
- `row_grain`: 'NATIONAL', 'STATE', or 'MSA'
- `state`: two-letter abbreviation (NULL for NATIONAL)
- `msa_id`, `msa_cbsa_name`: MSA identifiers
- `carrier_plan_name`: one of four — "Aetna Choice POS", "BCBS PPO", "Cigna OAP", "UHC Choice POS Plus"
- `billing_class`: 'institutional', 'professional', or 'TOTAL'
- `setting_type`: 'inpatient', 'outpatient', or 'TOTAL'
- `presence_status`: 'BOTH', 'NEW_ONLY', 'BASE_ONLY'

**Version columns (every metric has _base and _new):**
- `pct_greenyellow_base` / `pct_greenyellow_new` — MRF-backed share (the headline quality metric)
- `pct_red_base` / `pct_red_new` — red (low-confidence imputed) share
- `pct_missing_base` / `pct_missing_new` — missing share
- `pct_carrier_mrf_spend_base` / `_new` — carrier MRF share
- `pct_hospital_mrf_spend_base` / `_new` — hospital MRF share
- `pct_imputed_spend_base` / `_new` — total imputed share
- `total_weighted_rate_base` / `_new` — spend per 1,000 population
- `delta_pct_greenyellow`, `delta_pct_red`, `delta_pct_missing` — new minus base (pre-computed)
- `review_label_base` / `review_label_new` — canonical issue label ("clean", "Low Carrier MRF", "Low Carrier MRF, High Red", etc.)
- `supplementary_label_base` / `_new` — supplementary flags
- `flag_needs_review_base` / `_new` — 0 or 1
- `flag_canonical_count_base` / `_new` — number of conditions (0–4)
- `review_direction` — 'improved', 'regressed', 'stable', 'still_clean'
- `label_transition` — human-readable e.g. "clean -> Low Carrier MRF, High Red"

**Quality thresholds (from Peter's spreadsheet, apply to TOTAL/TOTAL rows):**
- Low Carrier MRF: `pct_carrier_mrf_spend < 25%`
- Low Hospital MRF: `pct_hospital_mrf_spend < 5%`
- High Red: `pct_red > 20%`
- High Missing: `pct_missing > 50%`

These match the `review_label` values already computed in the data.

---

## Primary View: State × Carrier Matrix ("Data Review Questions")

### Layout
Full-width grid. Sticky header row (carriers). Sticky first column (states).

### State row order (population rank from Peter's spreadsheet):
```
CA, TX, FL, NY, PA, IL, OH, GA, NC, MI, NJ, VA, WA, AZ, MA, TN, IN, MD, MO, WI,
CO, MN, SC, AL, LA, KY, OR, OK, CT, UT, IA, NV, AR, MS, KS, NM, NE, ID, WV, HI,
NH, ME, RI, MT, DE, SD, ND, AK, DC, VT, WY
```

### Carrier column order:
Aetna Choice POS | BCBS PPO | Cigna OAP | UHC Choice POS Plus

### Cell display
Each cell shows the `review_label` for that state+carrier at `billing_class='TOTAL'`, `setting_type='TOTAL'`.

**Color coding by flag count:**
- 0 flags (clean): `bg-emerald-50 text-emerald-700 border-emerald-200`
- 1 flag: `bg-yellow-50 text-yellow-800 border-yellow-300`
- 2 flags: `bg-orange-50 text-orange-800 border-orange-300`
- 3+ flags: `bg-red-50 text-red-800 border-red-300`
- N/A / missing data: `bg-gray-50 text-gray-400`

**Label abbreviations shown in cell (space-constrained):**
- "Low Carrier MRF" → `LC`
- "Low Hospital MRF" → `LH`
- "High Red" → `HR`
- "High Missing" → `HM`
- "clean" → empty (just the green background, maybe a subtle ✓)

Show abbreviated tags as small pill badges inside the cell, stacked if multiple.

### Version toggle (top of view)
Three-way pill: **v8.2** | **v9** | **Δ Delta**
- v8.2: show `_base` label, `flag_canonical_count_base`, colors
- v9: show `_new` label, `flag_canonical_count_new`, colors
- Δ Delta: show `review_direction` with directional icons:
  - `improved` → green arrow up ↑ + "Improved"
  - `regressed` → red arrow down ↓ + "Regressed"
  - `still_clean` → gray dash — "Clean"
  - `stable` → yellow tilde ~ "Stable"

### Carrier toggles
Four pill toggles (all ON by default) to show/hide carrier columns. When a carrier is hidden, its column collapses.

---

## Grain Selector
Pill toggle at top: **National** | **State** | **MSA**

### National grain view
Show a summary panel above the matrix (matrix is STATE grain, so National = summary cards + charts):
- 4 metric cards (one per carrier): G/Y% with v8.2 → v9 comparison and delta arrow
- Recharts BarChart: 4 carriers × {G/Y%, Red%, Missing%} grouped bars, toggle between base/new
- Recharts BarChart: setting breakdown (Inpatient / Outpatient / Professional) for selected carrier
- The matrix below shows national TOTAL row context

When "National" is selected, show the national summary cards + charts. The matrix still shows STATE grain data below for context.

### State grain view (DEFAULT)
The state × carrier matrix as described above.

### MSA grain view
Replace the matrix with:
- State selector dropdown (default: first state alphabetically with data)
- For selected state: MSA cards/rows showing each MSA's carrier labels
- Same color coding, same version toggle applies

---

## Cell Click → Detail Panel
Clicking any cell opens a **slide-in right panel** (not a modal — slides from right edge, ~480px wide, overlays but doesn't replace content). Contains:

**Header:** State name | Carrier name | "v8.2 → v9"

**Section 1: Quality Snapshot**
Small 3-column grid showing v8.2 / v9 / Delta for each metric:
- G/Y (MRF-Backed %)
- Red %
- Missing %
- Carrier MRF %
- Hospital MRF %
- Imputed %
- Spend per 1k

**Section 2: Label Transition**
Show `label_transition` string prominently, styled with the appropriate color.
Show `review_direction` badge.

**Section 3: Setting Breakdown**
Sub-table or mini-cards for the three settings at this state+carrier:
- Inpatient (institutional/inpatient rows)
- Outpatient Facility (institutional/outpatient rows)
- Professional (professional/outpatient rows)
Each shows v8.2 G/Y% → v9 G/Y% with delta.

**Section 4: Flags**
List all review flags from `review_label_new` and `supplementary_label_new`.

Close button (X) at top right of panel. Clicking outside also closes.

---

## PDF Side Panel
**Collapsible right panel** (separate from cell detail panel — this is a persistent side panel toggle):
- Trigger: "📄 Reference Docs" button in the view header, top right
- Panel slides in from right (~420px), sits alongside the matrix
- Two docs listed:
  1. "v9 Data Quality Review" → `public/data/v9-data-quality-review.pdf`
  2. "Technical Reference / Data Dictionary" → `public/data/v9-technical-reference.pdf`
- Each has: title, brief description, **Download** button (`<a href="..." download>`)
- **PDF Preview**: clicking a doc title shows it in an `<iframe>` embedded in the panel
- Panel has its own close X button
- Note: when PDF panel is open AND cell detail panel is open, cell detail panel takes priority (PDF panel closes or shifts)

The PDF base URLs should use `/mma-tracker/data/` prefix (GitHub Pages subpath).

---

## US Heatmap (State grain)
Above the state matrix, optionally toggled on/off with a "🗺 Map View" toggle button:
- Reuse the existing topojson + d3-geo infrastructure from `src/components/starset/USMap.tsx`
- Color each state by the selected metric for the **first visible carrier** (or average across visible carriers — your call on what's cleaner)
- Metric selector: G/Y % | Red % | Missing % (defaults to G/Y %)
- Color scale for G/Y (higher = better MRF coverage):
  - ≥80%: `#22c55e` (green)
  - 70–79%: `#84cc16`
  - 60–69%: `#eab308` (yellow)
  - 50–59%: `#f97316` (orange)
  - <50%: `#ef4444` (red)
- For Delta mode: green = improved, red = regressed
- Hovering a state shows tooltip with state name + metric value
- Clicking a state scrolls the matrix to that state row and highlights it

---

## Styling Rules
- Match existing platform aesthetic: dark navy sidebar (`#001A41`), white content area, `mma-light-bg` body
- Header uses `bg-white border-b border-gray-200 px-6 py-4` pattern (see DataIntelligenceView.tsx)
- Use Tailwind classes only — no inline style blocks except where necessary for dynamic values
- Use `lucide-react` for all icons
- Recharts for all charts — already installed

---

## File to Create
`src/components/starset/ProductionRunSummariesView.tsx`

Keep it as one file unless it gets unwieldy (>600 lines) — then split into logical sub-components in the same folder.

---

## Files to Modify
1. `src/components/navigation/AppDrawer.tsx`
   - Add `'production-run-summaries'` to `AppView` type
   - Add "Collateral" group above "Joint Project Work"
   - Move `data-intelligence` item into "Collateral"
   - Add `production-run-summaries` item into "Collateral"
   - Remove `data-intelligence` from "Network Navigator Deployment"

2. `src/App.tsx`
   - Import `ProductionRunSummariesView`
   - Add view render case

---

## Deploy
After building and verifying no TypeScript errors (`npx tsc --noEmit`):
```bash
npm run deploy
```
This pushes to `gh-pages` branch → live at `https://ds016683.github.io/mma-tracker/`

The GitHub token is already set in environment (inherited from shell).

---

## Priority Order
1. Nav restructure (Collateral category, move Data Intelligence, add Production Run Summaries)
2. State × Carrier matrix with v8.2/v9/Delta toggle and carrier toggles
3. Cell click → detail panel
4. National summary cards + charts
5. PDF side panel
6. US Heatmap (map view toggle)
7. MSA drill-down view

Get 1–4 solid before moving to 5–7.
