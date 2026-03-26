from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.api.v1.api import api_router
from app.db.init_db import init_db_and_seed


def create_app() -> FastAPI:
    app = FastAPI(title="Student Management CRM")

    # With allow_credentials=True, browsers reject allow_origins=["*"]. Use a regex
    # so we allow localhost and any ngrok tunnel origin.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[],
        allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$|https://[a-z0-9-]+\.ngrok-free\.app$|https://[a-z0-9-]+\.ngrok\.(io|dev)$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix="/api/v1")

    static_dir = Path(__file__).resolve().parent.parent / "static"
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

    @app.on_event("startup")
    def startup_event() -> None:
        init_db_and_seed()

    return app


app = create_app()
