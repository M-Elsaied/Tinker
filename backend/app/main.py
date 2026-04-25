import math
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json

from app.routers import (
    designs, analysis, diagnostics, optimization, transforms,
    narrative, effects, prediction, evaluation, augment,
)


def _scrub(v: Any) -> Any:
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    if isinstance(v, dict):
        return {k: _scrub(x) for k, x in v.items()}
    if isinstance(v, list):
        return [_scrub(x) for x in v]
    return v


class SafeJSONResponse(JSONResponse):
    def render(self, content: Any) -> bytes:
        return json.dumps(
            _scrub(content),
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":"),
        ).encode("utf-8")


app = FastAPI(
    title="DOE Lab API",
    description="Free, open-source Design of Experiments backend",
    version="0.1.0",
    default_response_class=SafeJSONResponse,
)

_default_origins = "http://localhost:5173,http://localhost:4173"
_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", _default_origins).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "doe-lab-api"}


app.include_router(designs.router, prefix="/api/designs", tags=["designs"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(diagnostics.router, prefix="/api/diagnostics", tags=["diagnostics"])
app.include_router(optimization.router, prefix="/api/optimization", tags=["optimization"])
app.include_router(transforms.router, prefix="/api/transforms", tags=["transforms"])
app.include_router(narrative.router, prefix="/api/narrative", tags=["narrative"])
app.include_router(effects.router, prefix="/api/analysis", tags=["effects"])
app.include_router(prediction.router, prefix="/api/prediction", tags=["prediction"])
app.include_router(evaluation.router, prefix="/api/design", tags=["evaluation"])
app.include_router(augment.router, prefix="/api/designs", tags=["augment"])


# Serve the built SPA (frontend/dist copied into the image at /app/frontend_dist).
# Same-origin hosting means the SPA's `/api/*` calls work without CORS in prod.
_DIST = Path(os.getenv("FRONTEND_DIST", "/app/frontend_dist"))
if _DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str) -> FileResponse:
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")
        candidate = _DIST / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(_DIST / "index.html")
