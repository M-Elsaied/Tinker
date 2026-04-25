---
title: DOE Lab
emoji: 🧪
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# DOE Lab

A free, open-source web application for **Design of Experiments (DOE)** — a modern, browser-based alternative to commercial tools like Stat-Ease Design-Expert.

DOE Lab walks an experimenter end-to-end: pick a design, enter the response data, fit and diagnose the model, optimize across multiple responses, and export a publication-quality PDF report. Everything runs locally in the browser plus a small FastAPI backend — no account required, your data never leaves your machine.

> Built for engineering and statistics students, lab researchers, and process engineers who need a serious DOE workbench without paying for a license.

---

## Highlights

- **Every common design type** — full / fractional factorial, Plackett–Burman, central composite (CCD), Box–Behnken (BBD), definitive screening, D / I-optimal, mixture, Latin hypercube.
- **Full statistical pipeline** — ANOVA with lack-of-fit, multiple model orders, VIF, R² / Adj-R² / Pred-R² / Adequate Precision / PRESS, Box–Cox power transforms, and the final equation in both coded and actual units.
- **Rich diagnostics** — normal probability plot, studentized residuals vs predicted / run order / factors, leverage, Cook's distance, Shapiro–Wilk normality, Pareto chart of effects.
- **Interactive visualization** — Plotly-powered 2-D contours with design-point overlay, rotatable 3-D response surfaces, interaction plots, perturbation plots, Box–Cox log-likelihood plot.
- **Multi-response optimization** — Derringer–Suich desirability with per-response goal (min / max / target / range), weight, and importance; ranked solutions with desirability ramps and a sweet-spot overlay.
- **Comprehensive report export** — one-click A4 PDF with cover, executive summary, design, data, per-response analysis, diagnostics, optimization, and a glossary appendix. Plot snapshots use Plotly's native `toImage` at 2× DPI for crisp output.
- **Auto-narrative interpretation** — every analysis section includes plain-language paragraphs explaining what the numbers mean, in the style of Design-Expert's analysis summary.
- **Modern, polished UI** — light / dark theme with system follow, Linear-style command palette (`⌘K`), Vim-style `g+key` navigation, sparklines, glossary popovers for stats jargon, and full keyboard accessibility.
- **Local-first** — IndexedDB persistence (via Dexie). Projects survive refreshes, work offline, and never sync to a server.
- **Built-in worked examples** — chemical-yield optimization (CCD), filtration screening (fractional factorial), and a multi-response cake-recipe (BBD with Moistness × Sweetness).

---

## Quick start

### One command (Docker)

```bash
docker compose up --build
```

Open <http://localhost:8080>. The image bundles the built React SPA into the FastAPI container, so a single service serves both the UI and the API.

### Local development

**Backend** (Python 3.11+):

```bash
cd backend
python -m venv .venv
source .venv/bin/activate            # macOS / Linux
# .venv\Scripts\activate              # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

**Frontend** (Node 20+):

```bash
cd frontend
npm install
npm run dev
```

Vite serves at <http://localhost:5173> and proxies `/api/*` to the backend at port 8001. Open the URL — the home page lists the worked examples and a "New design" button.

---

## Architecture

```
Project/
├── Dockerfile                       # Multi-stage: node builds SPA → Python serves both
├── docker-compose.yml
├── backend/                         # FastAPI + numpy / scipy / statsmodels / pyDOE3
│   ├── requirements.txt
│   └── app/
│       ├── main.py                  # API entry, NaN-safe JSON encoder, SPA static mount
│       ├── routers/                 # designs, analysis, diagnostics, optimization,
│       │                            # transforms, narrative, effects, prediction,
│       │                            # evaluation, augment
│       ├── services/                # design_generators/, analysis_engine,
│       │                            # diagnostics_engine, optimization_engine,
│       │                            # prediction_engine, transforms, narrative_engine
│       └── models/                  # Pydantic request / response schemas
└── frontend/                        # React 18 + Vite + TypeScript + Tailwind + Plotly
    └── src/
        ├── pages/                   # Home, NewDesign, Design, Data, Analysis,
        │                            # Optimize, Profiler, Confirmation, Evaluation,
        │                            # Report
        ├── components/
        │   ├── ui/                  # Button, Card, Table, Tabs, Tooltip, Popover…
        │   ├── layout/              # AppShell, Sidebar, RequireProject
        │   ├── wizard/              # Multi-step DesignWizard
        │   ├── data/                # DataGrid, ImportExport (CSV / Excel)
        │   ├── analysis/            # AnovaTable, ModelSummary, FitSummary,
        │   │                        # CoefficientsTable
        │   ├── plots/               # Contour, Surface3D, NormalProb, Residuals,
        │   │                        # Cook's, BoxCox, Pareto, Perturbation
        │   ├── optimization/        # Goals editor, solutions table, sweet-spot map
        │   ├── narrative/           # NarrativeBlock, GlossaryPopover
        │   ├── command/             # cmdk palette + commands + ShortcutOverlay
        │   └── report/              # CoverPage, ExecutiveSummary, DesignSection,
        │                            # DataSection, AnalysisSection, OptimizationSection,
        │                            # NotesSection, GlossaryAppendix
        ├── stores/                  # Zustand projectStore + uiStore
        ├── services/                # API client + IndexedDB (Dexie)
        ├── lib/                     # insights, reportFetcher, pdfExport,
        │                            # plotlyToImage, utils, toast
        ├── hooks/                   # useTheme, useShortcuts, usePlotLayout
        └── data/                    # examples, glossary
```

### Backend at a glance

The FastAPI app exposes everything under `/api/*`:

| Route prefix              | Purpose                                                |
|---------------------------|--------------------------------------------------------|
| `/api/designs`            | Generate / augment design matrices                     |
| `/api/analysis`           | Run regression + ANOVA, fit summary, effects           |
| `/api/diagnostics`        | Residual, leverage, Cook's, Shapiro–Wilk               |
| `/api/transforms`         | Box–Cox power transform analysis                       |
| `/api/optimization`       | Numerical optimization (Derringer–Suich desirability)  |
| `/api/prediction`         | Contour / surface grid evaluation                      |
| `/api/evaluation`         | Design quality metrics (D-, A-, G-, I-efficiency, FDS) |
| `/api/narrative`          | Auto-generated interpretation paragraphs               |
| `/api/health`             | Liveness probe                                         |

Heavy maths uses `numpy`, `scipy`, `statsmodels`, and `pyDOE3`. NaN/Inf values from scipy are scrubbed by a custom `SafeJSONResponse` so JSON encoding never fails.

### Frontend at a glance

- **State**: Zustand stores persisted to IndexedDB via Dexie. The active project survives refresh and works offline.
- **Routing**: React Router with `framer-motion` page transitions; deep links work for every section.
- **Plots**: `react-plotly.js` with a shared `usePlotLayout` hook that re-themes plots when the user toggles dark mode.
- **Tables**: `@tanstack/react-table` wrapped in custom primitives.
- **Command palette**: `cmdk` mounted globally, opens on `⌘K` / `Ctrl+K`. Vim-style `g+letter` chords for fast navigation (`g h` Home, `g d` Design, `g a` Analysis, `g o` Optimize, `g r` Report, etc.).
- **PDF export**: `html2pdf.js` lazy-imported on click. Before snapshotting, every Plotly node is converted to a 2× PNG via `Plotly.toImage`, so the resulting PDF has crisp vector-quality charts instead of blurry rasters.

---

## Worked examples

Open from the home page — each loads a fully populated project so you can explore every feature without entering data first.

| Example                       | Design                       | Responses                |
|-------------------------------|------------------------------|--------------------------|
| Chemical reaction yield       | Central composite (CCD)      | Yield (%)                |
| Filtration screening          | 2⁵⁻¹ fractional factorial    | Filtration time (s)      |
| Cake recipe (multi-response)  | Box–Behnken (BBD)            | Moistness, Sweetness     |

---

## Keyboard shortcuts

| Keys              | Action                       |
|-------------------|------------------------------|
| `⌘K` / `Ctrl+K`   | Command palette              |
| `?`               | Show all shortcuts           |
| `g h`             | Home                         |
| `g n`             | New design                   |
| `g d`             | Design overview              |
| `g a`             | Analysis                     |
| `g o`             | Optimization                 |
| `g r`             | Report                       |
| `⌘ /`             | Toggle dark / light theme    |
| `⌘P`              | Print current page           |
| `⌘ shift E`       | Export report PDF            |
| `Esc`             | Close palettes / dialogs     |

---

## Comparison to Design-Expert

| Feature                              | Design-Expert | DOE Lab |
|--------------------------------------|:-------------:|:-------:|
| Full / fractional factorial          | ✅            | ✅       |
| Plackett–Burman                      | ✅            | ✅       |
| CCD (rotatable / face / inscribed)   | ✅            | ✅       |
| Box–Behnken                          | ✅            | ✅       |
| Definitive screening                 | ✅            | ✅       |
| D / I-optimal                        | ✅            | ✅       |
| Mixture designs                      | ✅            | ✅       |
| Latin hypercube                      | ✅            | ✅       |
| ANOVA + lack-of-fit                  | ✅            | ✅       |
| Box–Cox transformations              | ✅            | ✅       |
| Contour, 3-D surface, perturbation   | ✅            | ✅       |
| Desirability optimization            | ✅            | ✅       |
| Auto-narrative interpretation        | ✅            | ✅       |
| Comprehensive PDF report             | ✅            | ✅       |
| Split-plot                           | ✅            | ⏳       |
| Cost                                 | $1,995        | **Free** |

---

## Deployment

DOE Lab is a single Docker image (multi-stage build: Node compiles the SPA, Python serves it together with the FastAPI API). It deploys unchanged to:

- **Hugging Face Spaces** (Docker SDK) — recommended for a free always-on host. Push this repo to a Space and the included `README.md` frontmatter configures the build.
- **Render** — Web Service → Docker, root directory = repo root.
- **Fly.io** — `fly launch` picks up the Dockerfile.
- **Self-host** — `docker compose up --build` on any Linux/macOS/Windows host with Docker.

The container exposes port `7860` by default (Hugging Face convention) and honors `$PORT`.

---

## Development scripts

From `frontend/`:

| Script              | Action                              |
|---------------------|-------------------------------------|
| `npm run dev`       | Vite dev server with HMR            |
| `npm run build`     | Type-check + production build       |
| `npm run preview`   | Serve the production build locally  |

From `backend/`:

| Command                                       | Action                |
|-----------------------------------------------|-----------------------|
| `uvicorn app.main:app --reload --port 8001`   | Dev server with reload|
| `python -m pytest`                            | Run tests             |

---

## Tech stack

**Backend**: Python 3.12, FastAPI, Uvicorn, Pydantic v2, NumPy, SciPy, statsmodels, pandas, pyDOE3.

**Frontend**: React 18, TypeScript 5, Vite 5, Tailwind CSS 3, Radix UI primitives, Plotly.js, framer-motion, Zustand, Dexie (IndexedDB), TanStack Table, cmdk, sonner, lucide-react, html2pdf.js, xlsx, papaparse.

---

## License

MIT — free for academic, commercial, and personal use.
