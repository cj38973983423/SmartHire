"""AI 分析路由 — 简历评分"""

import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Resume
from app.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.hermes_client import score_resume_with_hermes

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/score", response_model=AnalyzeResponse, summary="AI 简历评分")
def analyze_resume(request: AnalyzeRequest, db: Session = Depends(get_db)):
    """使用 Hermes Agent 对简历进行职位匹配评分"""
    resume = db.query(Resume).filter(Resume.id == request.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")

    if not resume.raw_text:
        raise HTTPException(status_code=400, detail="简历文本为空，请先上传有效文件")

    # 调用 Hermes 评分
    result = score_resume_with_hermes(resume.raw_text, request.job_keywords)

    score = result.get("score", 0)
    score_reason = result.get("score_reason", "")
    summary = result.get("summary", "")

    # 更新数据库
    resume.score = score
    resume.score_reason = score_reason
    if summary:
        resume.summary = summary

    db.commit()
    db.refresh(resume)

    return AnalyzeResponse(
        resume_id=resume.id,
        score=score,
        score_reason=score_reason,
        summary=summary,
    )


@router.post("/score-all", summary="批量评分所有简历")
def score_all_resumes(
    job_keywords: list[str] = [],
    db: Session = Depends(get_db),
):
    """对数据库中所有待处理的简历进行批量评分"""
    resumes = db.query(Resume).filter(
        Resume.raw_text.isnot(None),
        Resume.raw_text != "",
    ).all()

    scored = 0
    failed = 0
    for resume in resumes:
        try:
            result = score_resume_with_hermes(resume.raw_text, job_keywords)
            if result.get("score") is not None:
                resume.score = result["score"]
                resume.score_reason = result.get("score_reason", "")
                scored += 1
            else:
                failed += 1
        except Exception as e:
            logger.warning(f"评分失败 resume #{resume.id}: {e}")
            failed += 1

    db.commit()
    return {"scored": scored, "failed": failed, "total": len(resumes)}
