"""简历 CRUD 路由"""

import datetime
import json
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database import get_db
from app.models import Resume, ResumeStatus
from app.schemas import (
    ResumeItem, ResumeDetail, ResumeUploadResponse,
    ResumeStatusUpdate, PaginatedResumes,
)
from app.services.storage import save_upload_file, extract_text
from app.services.hermes_client import parse_resume_with_hermes

router = APIRouter()


@router.post("", response_model=ResumeUploadResponse, summary="上传简历")
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """上传简历文件（PDF/DOCX），自动解析基本信息"""
    # 保存文件
    relative_path = await save_upload_file(file)

    # 确定文件类型
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else ""

    # 创建数据库记录
    resume = Resume(
        file_path=relative_path,
        file_name=file.filename or "unknown",
        file_type=ext,
        status=ResumeStatus.PENDING,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    # 异步提取文本并解析（这里同步做，后续可改为celery任务）
    try:
        raw_text = extract_text(relative_path, ext)
        if raw_text:
            resume.raw_text = raw_text
            parsed = parse_resume_with_hermes(raw_text)
            if parsed:
                resume.name = parsed.get("name")
                resume.skills = json.dumps(parsed.get("skills", []), ensure_ascii=False) if parsed.get("skills") else None
                resume.experience_years = parsed.get("experience_years")
                resume.education = parsed.get("education")
                resume.work_experience = parsed.get("work_experience")
                resume.summary = parsed.get("summary")
            db.commit()
    except Exception as e:
        # 解析失败不影响上传
        import logging
        logging.getLogger(__name__).warning(f"Resume parse failed: {e}")

    return ResumeUploadResponse(id=resume.id, file_name=resume.file_name)


@router.get("", response_model=PaginatedResumes, summary="简历列表")
def list_resumes(
    keyword: str = Query(None, description="关键词搜索"),
    skill: str = Query(None, description="技能筛选"),
    status: str = Query(None, description="状态筛选"),
    min_score: float = Query(None, ge=0, le=100),
    max_score: float = Query(None, ge=0, le=100),
    min_experience: float = Query(None, ge=0),
    max_experience: float = Query(None, ge=0),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at", pattern="^(created_at|score|experience_years|name)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    """获取简历列表，支持搜索、筛选、排序、分页"""
    query = db.query(Resume)

    # 关键词搜索（姓名、技能、摘要）
    if keyword:
        kw = f"%{keyword}%"
        query = query.filter(
            or_(
                Resume.name.ilike(kw),
                Resume.skills.ilike(kw),
                Resume.summary.ilike(kw),
                Resume.raw_text.ilike(kw),
            )
        )

    # 技能筛选
    if skill:
        query = query.filter(Resume.skills.ilike(f"%{skill}%"))

    # 状态筛选
    if status:
        try:
            status_enum = ResumeStatus(status)
            query = query.filter(Resume.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"无效的状态: {status}")

    # 评分范围
    if min_score is not None:
        query = query.filter(Resume.score >= min_score)
    if max_score is not None:
        query = query.filter(Resume.score <= max_score)

    # 工作年限范围
    if min_experience is not None:
        query = query.filter(Resume.experience_years >= min_experience)
    if max_experience is not None:
        query = query.filter(Resume.experience_years <= max_experience)

    # 排序
    sort_col = getattr(Resume, sort_by, Resume.created_at)
    if sort_order == "desc":
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())

    # 分页
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResumes(
        items=[ResumeItem.model_validate(r) for r in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if total > 0 else 0,
    )


@router.get("/{resume_id}", response_model=ResumeDetail, summary="简历详情")
def get_resume(resume_id: int, db: Session = Depends(get_db)):
    """获取单份简历的完整信息"""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")
    return ResumeDetail.model_validate(resume)


@router.patch("/{resume_id}/status", response_model=ResumeDetail, summary="更新简历状态")
def update_resume_status(
    resume_id: int,
    update: ResumeStatusUpdate,
    db: Session = Depends(get_db),
):
    """HR 标记简历状态：已查看/待定/通过/淘汰，可添加备注"""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")

    resume.status = update.status
    if update.review_note is not None:
        resume.review_note = update.review_note
    resume.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(resume)
    return ResumeDetail.model_validate(resume)


@router.delete("/{resume_id}", summary="删除简历")
def delete_resume(resume_id: int, db: Session = Depends(get_db)):
    """删除简历记录和源文件"""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")

    # 删除源文件
    import os as os_mod
    file_path = os_mod.path.join("./uploads", resume.file_path)
    if os_mod.path.exists(file_path):
        os_mod.remove(file_path)

    db.delete(resume)
    db.commit()
    return {"message": "删除成功"}
