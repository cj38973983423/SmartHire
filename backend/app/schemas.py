"""Pydantic 请求/响应模型"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.models import ResumeStatus


# ══════════════════════════════════════════════
# JD 职位描述
# ══════════════════════════════════════════════

class JDItem(BaseModel):
    """JD 列表项"""
    id: int
    title: str
    department: Optional[str] = None
    location: Optional[str] = None
    is_active: int = 1
    created_at: datetime

    model_config = {"from_attributes": True}


class JDDetail(JDItem):
    """JD 详情"""
    content: str
    required_skills: Optional[str] = None
    nice_to_have: Optional[str] = None
    experience_required: Optional[str] = None
    education_required: Optional[str] = None
    summary: Optional[str] = None
    updated_at: datetime


class JDCreate(BaseModel):
    """创建 JD"""
    title: str = Field(..., min_length=1, max_length=256, description="职位名称")
    department: Optional[str] = None
    location: Optional[str] = None
    content: str = Field(..., min_length=1, description="JD 全文")
    required_skills: Optional[str] = None
    nice_to_have: Optional[str] = None
    experience_required: Optional[str] = None
    education_required: Optional[str] = None
    summary: Optional[str] = None


class JDUpdate(BaseModel):
    """更新 JD"""
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    content: Optional[str] = None
    required_skills: Optional[str] = None
    nice_to_have: Optional[str] = None
    experience_required: Optional[str] = None
    education_required: Optional[str] = None
    summary: Optional[str] = None
    is_active: Optional[int] = None


class PaginatedJDs(BaseModel):
    items: list[JDItem]
    total: int
    page: int
    page_size: int
    total_pages: int


# ══════════════════════════════════════════════
# 简历
# ══════════════════════════════════════════════

class ResumeItem(BaseModel):
    """简历列表项"""
    id: int
    name: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[float] = None
    score: Optional[float] = None
    status: ResumeStatus
    file_name: str
    jd_id: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ResumeDetail(ResumeItem):
    """简历详情"""
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


class ResumeUploadResponse(BaseModel):
    id: int
    file_name: str
    message: str = "上传成功，正在解析中..."


class ResumeStatusUpdate(BaseModel):
    status: ResumeStatus
    review_note: Optional[str] = None


class ResumeSearchParams(BaseModel):
    keyword: Optional[str] = None
    skill: Optional[str] = None
    min_score: Optional[float] = None
    max_score: Optional[float] = None
    status: Optional[ResumeStatus] = None
    min_experience: Optional[float] = None
    max_experience: Optional[float] = None
    jd_id: Optional[int] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: str = "created_at"
    sort_order: str = "desc"


class PaginatedResumes(BaseModel):
    items: list[ResumeItem]
    total: int
    page: int
    page_size: int
    total_pages: int


# ══════════════════════════════════════════════
# AI 分析
# ══════════════════════════════════════════════

class AnalyzeRequest(BaseModel):
    resume_id: int
    jd_id: Optional[int] = Field(None, description="关联的 JD ID，传入后基于 JD 全文综合评分")
    job_keywords: list[str] = Field(default_factory=list, description="职位关键词（当无 jd_id 时使用）")


class AnalyzeResponse(BaseModel):
    resume_id: int
    jd_id: Optional[int] = None
    jd_title: Optional[str] = None
    score: float
    score_reason: str
    summary: str
    score_detail: Optional[str] = None  # JSON 格式的详细维度分析


# ══════════════════════════════════════════════
# 评分记录
# ══════════════════════════════════════════════

class ResumeScoreItem(BaseModel):
    """简历对某个 JD 的评分记录"""
    id: int
    resume_id: int
    jd_id: int
    score: float
    score_reason: Optional[str] = None
    summary: Optional[str] = None
    score_detail: Optional[str] = None
    created_at: datetime
    jd_title: Optional[str] = None  # 联表查询填充

    model_config = {"from_attributes": True}


class BatchScoreRequest(BaseModel):
    """批量评分请求"""
    resume_ids: list[int] = Field(..., min_length=1, max_length=50, description="简历 ID 列表")
    jd_id: int = Field(..., description="JD ID")


# ══════════════════════════════════════════════
# 仪表盘
# ══════════════════════════════════════════════

class DashboardStats(BaseModel):
    total_resumes: int
    pending_count: int
    reviewed_count: int
    shortlisted_count: int
    rejected_count: int
    avg_score: Optional[float] = None
    total_jds: Optional[int] = None
