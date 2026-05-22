"""Pydantic 请求/响应模型"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.models import ResumeStatus


# ── 简历列表项 ──
class ResumeItem(BaseModel):
    id: int
    name: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[float] = None
    score: Optional[float] = None
    status: ResumeStatus
    file_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── 简历详情 ──
class ResumeDetail(ResumeItem):
    phone: Optional[str] = None
    email: Optional[str] = None
    education: Optional[str] = None
    work_experience: Optional[str] = None
    summary: Optional[str] = None
    score_reason: Optional[str] = None
    review_note: Optional[str] = None
    file_type: str
    file_path: str
    updated_at: datetime


# ── 简历上传响应 ──
class ResumeUploadResponse(BaseModel):
    id: int
    file_name: str
    message: str = "上传成功，正在解析中..."


# ── 简历状态更新 ──
class ResumeStatusUpdate(BaseModel):
    status: ResumeStatus
    review_note: Optional[str] = None


# ── 简历搜索参数 ──
class ResumeSearchParams(BaseModel):
    keyword: Optional[str] = None
    skill: Optional[str] = None
    min_score: Optional[float] = None
    max_score: Optional[float] = None
    status: Optional[ResumeStatus] = None
    min_experience: Optional[float] = None
    max_experience: Optional[float] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: str = "created_at"
    sort_order: str = "desc"


# ── 分页响应 ──
class PaginatedResumes(BaseModel):
    items: list[ResumeItem]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── AI 分析请求 ──
class AnalyzeRequest(BaseModel):
    resume_id: int
    job_keywords: list[str] = Field(default_factory=list, description="职位关键词，如 ['Python', 'FastAPI']")


# ── AI 分析响应 ──
class AnalyzeResponse(BaseModel):
    resume_id: int
    score: float
    score_reason: str
    summary: str


# ── 仪表盘统计 ──
class DashboardStats(BaseModel):
    total_resumes: int
    pending_count: int
    reviewed_count: int
    shortlisted_count: int
    rejected_count: int
    avg_score: Optional[float] = None
