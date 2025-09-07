from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from starlette.responses import RedirectResponse
from app.core.config import settings
from app.api.routes import api_router

app = FastAPI(title=settings.app_name, docs_url="/docs" if settings.enable_docs else None, redoc_url=None)

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


@app.get("/")
async def root():
	return RedirectResponse(url="/health")


@app.get("/health")
async def health():
	return {"status": "ok"}


app.include_router(api_router, prefix="/api")

# Placeholder mounts for future UI assets
app.mount("/static", StaticFiles(directory="app/static"), name="static")