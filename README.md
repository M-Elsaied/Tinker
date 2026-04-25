---
title: Tinker
emoji: 🧪
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Tinker — Design of Experiments, in your browser

[![Live demo](https://img.shields.io/badge/demo-melsaied1--tinker.hf.space-blue?style=flat-square&logo=huggingface)](https://melsaied1-tinker.hf.space)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](LICENSE)
[![Built with FastAPI](https://img.shields.io/badge/backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Built with React](https://img.shields.io/badge/frontend-React%2018-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Docker](https://img.shields.io/badge/deploy-Docker-2496ED?style=flat-square&logo=docker)](Dockerfile)

A free, open-source workbench for **Design of Experiments (DOE)** — an alternative to Stat-Ease Design-Expert that runs in any browser. Pick a design, enter the data, fit and diagnose the model, optimize across multiple responses, and export a publication-ready PDF report.

> 🚀 **Try it live:** [melsaied1-tinker.hf.space](https://melsaied1-tinker.hf.space)

---

## Why Tinker?

Commercial DOE software (Design-Expert, JMP, Minitab) is powerful but costs $1,000–$2,000 per seat — out of reach for most students, hobbyists, and small labs. Tinker provides the same end-to-end workflow in a modern web app, free and open source. Data stays on your machine (IndexedDB, no account), and the entire pipeline — design generation, regression, ANOVA, diagnostics, optimization, reporting — is implemented from open primitives (NumPy, SciPy, statsmodels, pyDOE3).

## Features

### Design generation
- Full and fractional factorial (2ᵏ, 2ᵏ⁻ᵖ) with custom generators
- Plackett–Burman screening
- Central composite (CCD): rotatable, face-centered, inscribed
- Box–Behnken (BBD)
- Definitive screening designs (DSD)
- D- and I-optimal designs (coordinate exchange)
- Mixture designs (simplex lattice / centroid)
- Latin hypercube sampling
- Center points, blocking, replication, randomized run order

### Statistical analysis
- ANOVA with sums-of-squares decomposition and per-term significance
- Linear, two-factor interaction, quadratic, and cubic models
- Lack-of-fit testing using replicates
- Fit Summary table comparing candidate model orders
- Variance Inflation Factors (VIF), R², adjusted R², predicted R², adequate precision, PRESS
- Box–Cox transformation analysis with recommendation
- Final equations in both coded and actual units

### Diagnostics
- Normal probability plot of residuals
- Studentized residuals vs predicted, run order, and individual factors
- Leverage and Cook's distance
- DFFITS plot
- Shapiro–Wilk normality test
- Pareto chart of effects with t-critical reference line

### Visualization
- Interactive 2D contour plots with overlaid design points
- Rotatable 3D response-surface plots
- Two-factor interaction plots
- Perturbation (one-factor-at-a-time) plots
- Box–Cox log-likelihood plot

### Optimization
- Multi-response numerical optimization
- Derringer–Suich desirability functions (minimize / maximize / target / range)
- Per-response weight and importance
- Ranked solution list with desirability ramps and a sweet-spot overlay

### Reporting
- One-click A4 PDF export with cover, executive summary, design, data, per-response analysis, diagnostics, optimization, and a glossary appendix
- Plot snapshots use Plotly's native `toImage` at 2× DPI for crisp, vector-quality figures
- Auto-generated narrative paragraphs explain every analysis section in plain language

### Workflow
- Local-first persistence in IndexedDB — works offline, survives refreshes, never leaves your browser
- CSV / Excel import and export
- Spreadsheet-style data entry with paste support
- Light / dark theme with system follow
- Linear-style command palette (`⌘K`) and Vim-style `g+key` navigation
- Glossary popovers for every statistical term

## Built-in worked examples

Open from the home page — each loads a fully populated project so you can explore the entire workflow without entering data.

| Example | Design | Responses | Use case |
|---|---|---|---|
| Chemical reaction yield | Central composite (CCD) | Yield | RSM, optimization |
| Filtration screening | 2⁴⁻¹ fractional factorial | Filtration rate | Effect screening |
| Cake recipe | Box–Behnken (BBD) | Moistness, Sweetness | Multi-response optimization |
| Paper airplane (fractional) | 2³⁻¹ resolution-III | Distance | Replicated screening, outlier diagnostics |
| Paper airplane (full) | 2⁴ full factorial | Distance | Main effects + interactions |

## Quick start

### Try it online
No install needed — open the live demo at **<https://melsaied1-tinker.hf.space>**.

### Run locally with Docker

```bash
git clone https://github.com/M-Elsaied/Tinker.git
cd Tinker
docker compose up --build
```

Open <http://localhost:8080>. The image bundles the built React SPA into the FastAPI container, so a single service serves both the UI and the API.

### Run for development

**Backend** (Python 3.12+):

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

Vite serves at <http://localhost:5173> and proxies `/api/*` to the backend at port 8001.

## Architecture

Tinker is a single-image two-tier application:

- **Backend** — FastAPI + Pydantic v2, with NumPy / SciPy / statsmodels / pyDOE3 doing the statistical heavy lifting. NaN-safe JSON encoder so scipy edge cases never crash the API.
- **Frontend** — React 18 + TypeScript + Vite, Tailwind CSS, Radix UI primitives, Plotly.js, framer-motion, Zustand, Dexie (IndexedDB), TanStack Table, cmdk, html2pdf.js.

```
Tinker/
├── Dockerfile                 # Multi-stage: Node builds the SPA → Python serves both
├── docker-compose.yml
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── main.py            # FastAPI entry, NaN-safe JSON encoder, SPA static mount
│       ├── routers/           # designs, analysis, diagnostics, optimization,
│       │                      # transforms, narrative, effects, prediction,
│       │                      # evaluation, augment
│       ├── services/          # design generators, analysis_engine, diagnostics_engine,
│       │                      # optimization_engine, prediction_engine, transforms,
│       │                      # narrative_engine
│       └── models/            # Pydantic request / response schemas
└── frontend/
    └── src/
        ├── pages/             # Home, NewDesign, Design, Data, Analysis, Optimize,
        │                      # Profiler, Confirmation, Evaluation, Report
        ├── components/        # ui/, layout/, wizard/, data/, analysis/, plots/,
        │                      # optimization/, narrative/, command/, report/
        ├── stores/            # Zustand projectStore + uiStore
        ├── services/          # API client + IndexedDB
        ├── lib/               # insights, reportFetcher, pdfExport, plotlyToImage
        ├── hooks/             # useTheme, useShortcuts, usePlotLayout
        └── data/              # examples, glossary
```

### REST API

All endpoints live under `/api/*`:

| Route prefix | Purpose |
|---|---|
| `/api/designs` | Generate and augment design matrices |
| `/api/analysis` | Regression, ANOVA, fit summary, effects |
| `/api/diagnostics` | Residual, leverage, Cook's distance, Shapiro–Wilk |
| `/api/transforms` | Box–Cox power transform analysis |
| `/api/optimization` | Numerical optimization (Derringer–Suich desirability) |
| `/api/prediction` | Contour and surface grid evaluation |
| `/api/evaluation` | Design quality metrics (D-, A-, G-, I-efficiency, FDS) |
| `/api/narrative` | Auto-generated interpretation paragraphs |
| `/api/health` | Liveness probe |

Interactive API docs are auto-generated by FastAPI at `/docs`.

## Keyboard shortcuts

| Keys | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Command palette |
| `?` | Show all shortcuts |
| `g h` | Home |
| `g n` | New design |
| `g d` | Design overview |
| `g a` | Analysis |
| `g o` | Optimization |
| `g r` | Report |
| `⌘ /` | Toggle dark / light theme |
| `⌘P` | Print current page |
| `⌘ Shift E` | Export report PDF |
| `Esc` | Close palettes / dialogs |

## Comparison to commercial DOE software

| Feature | Design-Expert | JMP | Tinker |
|---|:---:|:---:|:---:|
| Full / fractional factorial | ✅ | ✅ | ✅ |
| Plackett–Burman | ✅ | ✅ | ✅ |
| CCD (rotatable / face / inscribed) | ✅ | ✅ | ✅ |
| Box–Behnken | ✅ | ✅ | ✅ |
| Definitive screening | ✅ | ✅ | ✅ |
| D- / I-optimal | ✅ | ✅ | ✅ |
| Mixture designs | ✅ | ✅ | ✅ |
| Latin hypercube | ✅ | ✅ | ✅ |
| ANOVA + lack-of-fit | ✅ | ✅ | ✅ |
| Box–Cox transformations | ✅ | ✅ | ✅ |
| Contour, 3D surface, perturbation | ✅ | ✅ | ✅ |
| Desirability optimization | ✅ | ✅ | ✅ |
| Auto-narrative interpretation | ✅ | ⚠️ | ✅ |
| Comprehensive PDF report | ✅ | ✅ | ✅ |
| Local-first / offline | ❌ | ❌ | ✅ |
| Open source | ❌ | ❌ | ✅ |
| Cost (per seat) | $1,995 | $1,800+ | **Free** |

## Deployment

The same Dockerfile builds an image that runs unchanged on:

- **Hugging Face Spaces** (Docker SDK) — recommended free always-on host. Push the repo to a Space; the YAML frontmatter at the top of this README configures the build.
- **Render** — Web Service → Docker, root directory = repo root.
- **Fly.io** — `fly launch` picks up the Dockerfile.
- **Self-hosted** — `docker compose up --build` on any host with Docker.

The container exposes port `7860` by default (Hugging Face convention) and honors `$PORT`.

## Roadmap

- [x] Comprehensive PDF report export
- [x] Multi-response desirability optimization
- [x] Light / dark theme + command palette
- [x] Built-in worked examples (5)
- [ ] Split-plot designs
- [ ] Bayesian model averaging for screening
- [ ] Direct Excel `.xlsx` import (currently CSV via paste)
- [ ] Project sharing via signed export link

## Contributing

Issues and pull requests welcome. The codebase is intentionally small enough to read end-to-end in an afternoon.

For larger features please open an issue first to discuss the design. Useful entry points:

- Design generation: `backend/app/services/design_generators/`
- Statistical engines: `backend/app/services/analysis_engine.py`, `optimization_engine.py`
- UI primitives: `frontend/src/components/ui/`
- Worked examples: `frontend/src/data/examples.ts`

## Citation

If you use Tinker in academic work:

```bibtex
@software{tinker_doe,
  title  = {Tinker: an open-source web workbench for Design of Experiments},
  author = {Elsaied, Mohamed},
  year   = {2026},
  url    = {https://github.com/M-Elsaied/Tinker}
}
```

## License

MIT — free for academic, commercial, and personal use. See [LICENSE](LICENSE).

---

<sub>Built with FastAPI, React, Plotly, and a healthy disrespect for $1,995 license fees.</sub>
