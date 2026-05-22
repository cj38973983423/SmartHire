"""AI 分析路由 — 简历评分（支持通用关键词 & JD 全文评分）"""

import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Resume, JobDescription, ResumeScore
from app.schemas import AnalyzeRequest, AnalyzeResponse, ResumeScoreItem, BatchScoreRequest
from app.services.hermes_client import score_resume_with_hermes, score_resume_against_jd

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/score", response_model=AnalyzeResponse, summary="AI 简历评分")
def analyze_resume(request: AnalyzeRequest, db: Session = Depends(get_db)):
    """使用 Hermes Agent 对简历进行职位匹配评分

    - 传入 jd_id：基于 JD 全文进行四维度综合评价
    - 只传 job_keywords：基于关键词进行通用评分
    """
    resume = db.query(Resume).filter(Resume.id == request.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")

    if not resume.raw_text:
        raise HTTPException(status_code=400, detail="简历文本为空，请先上传有效文件")

    jd = None
    jd_title = None

    # ── 基于 JD 的综合评分 ──
    if request.jd_id:
        jd = db.query(JobDescription).filter(JobDescription.id == request.jd_id).first()
        if not jd:
            raise HTTPException(status_code=404, detail="JD 不存在")
        jd_title = jd.title

        result = score_resume_against_jd(resume.raw_text, jd.content, jd.title)

        score = result.get("score", 0)
        score_reason = result.get("score_reason", "")
        summary = result.get("summary", "")
        score_detail = json.dumps(result.get("score_detail", {}), ensure_ascii=False)

        # 保存到 resume_scores 表（多对多评分记录）
        score_record = ResumeScore(
            resume_id=resume.id,
            jd_id=jd.id,
            score=score,
            score_reason=score_reason,
            summary=summary,
            score_detail=score_detail,
        )
        db.add(score_record)

        # 同时更新 resume 主表的最新评分
        resume.score = score
        resume.score_reason = score_reason
        if summary:
            resume.summary = summary
        resume.jd_id = jd.id

    # ── 通用关键词评分 ──
    else:
        result = score_resume_with_hermes(resume.raw_text, request.job_keywords)

        score = result.get("score", 0)
        score_reason = result.get("score_reason", "")
        summary = result.get("summary", "")
        score_detail = None

        resume.score = score
        resume.score_reason = score_reason
        if summary:
            resume.summary = summary

    db.commit()
    db.refresh(resume)

    return AnalyzeResponse(
        resume_id=resume.id,
        jd_id=jd.id if jd else None,
        jd_title=jd_title,
        score=score,
        score_reason=score_reason,
        summary=summary,
        score_detail=score_detail,
    )


@router.get("/scores/{resume_id}", response_model=list[ResumeScoreItem], summary="简历评分历史")
def get_resume_scores(resume_id: int, db: Session = Depends(get_db)):
    """获取某份简历的所有历史评分记录（含 JD 名称）"""
    scores = (
        db.query(ResumeScore, JobDescription.title.label("jd_title"))
        .join(JobDescription, ResumeScore.jd_id == JobDescription.id, isouter=True)
        .filter(ResumeScore.resume_id == resume_id)
        .order_by(ResumeScore.created_at.desc())
        .all()
    )

    results = []
    for score, jd_title in scores:
        item = ResumeScoreItem.model_validate(score)
        item.jd_title = jd_title
        results.append(item)

    return results


@router.post("/score-all", summary="批量评分所有简历（通用模式）")
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


@router.post("/score-batch", summary="批量 JD 评分")
def batch_score_resumes(request: BatchScoreRequest, db: Session = Depends(get_db)):
    """选中多份简历，基于同一个 JD 进行批量 AI 评分"""
    jd = db.query(JobDescription).filter(JobDescription.id == request.jd_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="JD 不存在")

    resumes = db.query(Resume).filter(
        Resume.id.in_(request.resume_ids),
        Resume.raw_text.isnot(None),
        Resume.raw_text != "",
    ).all()

    if not resumes:
        raise HTTPException(status_code=400, detail="所选简历均无可用的文本内容")

    results = []
    for resume in resumes:
        try:
            result = score_resume_against_jd(resume.raw_text, jd.content, jd.title)
            score = result.get("score", 0)
            score_reason = result.get("score_reason", "")
            summary = result.get("summary", "")
            score_detail = json.dumps(result.get("score_detail", {}), ensure_ascii=False)

            # 保存评分记录
            score_record = ResumeScore(
                resume_id=resume.id, jd_id=jd.id,
                score=score, score_reason=score_reason,
                summary=summary, score_detail=score_detail,
            )
            db.add(score_record)

            # 更新简历主表
            resume.score = score
            resume.score_reason = score_reason
            if summary:
                resume.summary = summary
            resume.jd_id = jd.id

            results.append({
                "resume_id": resume.id,
                "resume_name": resume.name or "未知",
                "score": score,
                "score_reason": score_reason,
            })
        except Exception as e:
            logger.warning(f"Batch score failed for resume #{resume.id}: {e}")
            results.append({
                "resume_id": resume.id,
                "resume_name": resume.name or "未知",
                "score": 0,
                "score_reason": f"评分失败: {e}",
            })

    db.commit()
    return {"jd_title": jd.title, "total": len(resumes), "scored": len(results), "results": results}
