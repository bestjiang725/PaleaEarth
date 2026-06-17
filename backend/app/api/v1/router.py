"""API v1 router aggregation."""

from fastapi import APIRouter

from app.api.v1.time import router as time_router
from app.api.v1.variable import router as variable_router
from app.api.v1.query import router as query_router
from app.api.v1.generate import router as generate_router
from app.api.v1.tiles import router as tiles_router
from app.api.v1.task import router as task_router
from app.api.v1.admin import router as admin_router

api_v1_router = APIRouter()

api_v1_router.include_router(time_router, prefix="/time")
api_v1_router.include_router(variable_router, prefix="/variable")
api_v1_router.include_router(query_router, prefix="/query")
api_v1_router.include_router(generate_router, prefix="/generate")
api_v1_router.include_router(tiles_router, prefix="/tiles")
api_v1_router.include_router(task_router, prefix="/task")
api_v1_router.include_router(admin_router, prefix="/admin")
