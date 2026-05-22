"""JD 职位管理 CRUD 路由"""

import datetime
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import JobDescription
from app.schemas import (
    JDItem, JDDetail, JDCreate, JDUpdate, PaginatedJDs,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("", response_model=JDDetail, summary="创建 JD")
def create_jd(jd: JDCreate, db: Session = Depends(get_db)):
    """创建新的职位描述"""
    db_jd = JobDescription(
        title=jd.title,
        department=jd.department,
        location=jd.location,
        content=jd.content,
        required_skills=jd.required_skills,
        nice_to_have=jd.nice_to_have,
        experience_required=jd.experience_required,
        education_required=jd.education_required,
        summary=jd.summary,
    )
    db.add(db_jd)
    db.commit()
    db.refresh(db_jd)
    return JDDetail.model_validate(db_jd)


@router.get("", response_model=PaginatedJDs, summary="JD 列表")
def list_jds(
    keyword: str = Query(None, description="关键词搜索（标题/部门/内容）"),
    active_only: bool = Query(True, description="只显示启用的"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """获取 JD 列表，支持搜索和分页"""
    query = db.query(JobDescription)

    if keyword:
        kw = f"%{keyword}%"
        query = query.filter(
            JobDescription.title.ilike(kw)
            | JobDescription.department.ilike(kw)
            | JobDescription.content.ilike(kw)
        )

    if active_only:
        query = query.filter(JobDescription.is_active == 1)

    query = query.order_by(JobDescription.created_at.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedJDs(
        items=[JDItem.model_validate(j) for j in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if total > 0 else 0,
    )


@router.get("/{jd_id}", response_model=JDDetail, summary="JD 详情")
def get_jd(jd_id: int, db: Session = Depends(get_db)):
    """获取 JD 详情"""
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="JD 不存在")
    return JDDetail.model_validate(jd)


@router.put("/{jd_id}", response_model=JDDetail, summary="更新 JD")
def update_jd(jd_id: int, update: JDUpdate, db: Session = Depends(get_db)):
    """更新职位描述"""
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="JD 不存在")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(jd, key, value)
    jd.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(jd)
    return JDDetail.model_validate(jd)


@router.delete("/{jd_id}", summary="删除 JD")
def delete_jd(jd_id: int, db: Session = Depends(get_db)):
    """删除职位描述"""
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="JD 不存在")
    db.delete(jd)
    db.commit()
    return {"message": "删除成功"}
