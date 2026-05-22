"""FastAPI 主入口"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.routers import resumes, analyze, jds


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动时建表"""
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

# CORS — 允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(resumes.router, prefix="/api/resumes", tags=["简历管理"])
app.include_router(jds.router, prefix="/api/jds", tags=["JD 职位管理"])
app.include_router(analyze.router, prefix="/api/analyze", tags=["AI 分析"])

# 静态文件 — 直接访问上传的简历
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/api/health")
async def health_check():
    """健康检查"""
    return {"status": "ok", "version": settings.app_version}


@app.get("/api/stats")
async def dashboard_stats():
    """仪表盘数据"""
    from sqlalchemy import func
    from app.database import SessionLocal
    from app.models import Resume, ResumeStatus, JobDescription

    db = SessionLocal()
    try:
        total = db.query(func.count(Resume.id)).scalar() or 0
        pending = db.query(func.count(Resume.id)).filter(Resume.status == ResumeStatus.PENDING).scalar() or 0
        reviewed = db.query(func.count(Resume.id)).filter(Resume.status == ResumeStatus.REVIEWED).scalar() or 0
        shortlisted = db.query(func.count(Resume.id)).filter(Resume.status == ResumeStatus.SHORTLISTED).scalar() or 0
        rejected = db.query(func.count(Resume.id)).filter(Resume.status == ResumeStatus.REJECTED).scalar() or 0
        avg_score = db.query(func.avg(Resume.score)).filter(Resume.score.isnot(None)).scalar()
        total_jds = db.query(func.count(JobDescription.id)).scalar() or 0

        return {
            "total_resumes": total,
            "pending_count": pending,
            "reviewed_count": reviewed,
            "shortlisted_count": shortlisted,
            "rejected_count": rejected,
            "avg_score": round(avg_score, 1) if avg_score else None,
            "total_jds": total_jds,
        }
    finally:
        db.close()
