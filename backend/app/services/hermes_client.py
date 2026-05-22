"""Hermes Agent 集成服务"""

import json
import logging
import os
import re
import subprocess

from app.config import settings

logger = logging.getLogger(__name__)


def _call_hermes(prompt: str, timeout: int | None = None) -> str:
    """调用本地 Hermes Agent 执行 AI 任务"""
    if timeout is None:
        timeout = settings.hermes_timeout

    env = os.environ.copy()
    env["HERMES_YOLO_MODE"] = "1"

    try:
        result = subprocess.run(
            [settings.hermes_bin, "chat", "-q", prompt, "-Q"],
            capture_output=True,
            text=True,
            timeout=timeout,
            env=env,
        )
        if result.returncode != 0:
            error_msg = result.stderr.strip() or f"exit code {result.returncode}"
            logger.warning(f"Hermes returned non-zero: {error_msg}")
            return ""
        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        logger.warning(f"Hermes timeout after {timeout}s")
        return ""
    except FileNotFoundError:
        logger.warning(f"Hermes binary '{settings.hermes_bin}' not found")
        return ""


def _extract_json(text: str) -> dict | None:
    """从输出中提取第一个 JSON 对象"""
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return None


def parse_resume_with_hermes(raw_text: str) -> dict:
    """使用 Hermes Agent 解析简历文本为结构化数据"""
    prompt = f"""你是一位资深的HR招聘专家。请解析以下简历内容，返回 JSON 格式的结构化数据。

要求：
- name: 候选人姓名
- skills: 技能列表 (JSON array)
- experience_years: 工作年限 (数字)
- education: 教育经历简述
- work_experience: 工作经历简述
- summary: 30字以内的简历摘要

请只返回 JSON，不要其他内容。

简历内容：
{raw_text[:3000]}
"""
    output = _call_hermes(prompt)
    if not output:
        return {}

    result = _extract_json(output)
    if result:
        return result

    # 如果第一次没解析出来，再试一次
    retry_prompt = f"""只返回 JSON，不要多余文字。

{{"name": "...", "skills": [...], "experience_years": 0, "education": "...", "work_experience": "...", "summary": "..."}}

简历：
{raw_text[:2000]}
"""
    output = _call_hermes(retry_prompt)
    result = _extract_json(output)
    return result or {}


def score_resume_with_hermes(raw_text: str, job_keywords: list[str]) -> dict:
    """使用 Hermes Agent 对简历与职位关键词进行匹配评分（通用模式）"""
    keywords_str = ", ".join(job_keywords) if job_keywords else "通用职位"

    prompt = f"""你是一位资深的HR招聘专家。请根据以下职位关键词对简历进行匹配评分。

职位关键词：{keywords_str}

请返回 JSON 格式：
{{"score": 0-100的整数, "score_reason": "评分理由（50字以内的中文）", "summary": "候选人亮点总结（30字以内）"}}

评分标准：
- 技能匹配度：40分
- 工作经验：30分
- 教育背景：15分
- 综合潜力：15分

请只返回 JSON，不要其他内容。

简历内容：
{raw_text[:3000]}
"""
    output = _call_hermes(prompt)
    if not output:
        return {"score": 0, "score_reason": "AI 分析暂时不可用", "summary": ""}

    result = _extract_json(output)
    return result or {"score": 0, "score_reason": "解析失败", "summary": ""}


def score_resume_against_jd(raw_text: str, jd_content: str, jd_title: str) -> dict:
    """使用 Hermes Agent 对简历进行基于 JD 全文的综合评价

    返回结构：
    {
        "score": 0-100,
        "score_reason": "综合评价理由",
        "summary": "候选人亮点总结",
        "score_detail": {
            "skill_match": {"score": 0-100, "reason": "..."},
            "experience_match": {"score": 0-100, "reason": "..."},
            "education_match": {"score": 0-100, "reason": "..."},
            "overall_fit": {"score": 0-100, "reason": "..."}
        }
    }
    """
    prompt = f"""你是一位资深的HR招聘专家。请根据以下【职位描述（JD）】对候选人【简历】进行全面的综合评价。

===== 职位描述（JD）：{jd_title} =====
{jd_content[:3000]}
========================================

请从以下四个维度进行评分，每个维度 0-100 分，然后计算加权总分：

1. **技能匹配度** (权重 40%) — 候选人技能与 JD 要求的匹配程度
2. **经验匹配度** (权重 30%) — 候选人工作经验与 JD 要求的契合度
3. **教育背景匹配度** (权重 15%) — 候选人的教育背景是否符合 JD 要求
4. **综合契合度** (权重 15%) — 候选人整体素质、职业规划与职位/公司的匹配度

请返回 JSON 格式：
{{{{
    "score": 加权总分(0-100的整数),
    "score_reason": "综合评价（100字以内的中文，说明为什么给这个分数，优点和不足各提一点）",
    "summary": "候选人核心亮点（30字以内）",
    "score_detail": {{{{
        "skill_match": {{{{ "score": 0, "reason": "技能匹配分析" }}}},
        "experience_match": {{{{ "score": 0, "reason": "经验匹配分析" }}}},
        "education_match": {{{{ "score": 0, "reason": "教育背景分析" }}}},
        "overall_fit": {{{{ "score": 0, "reason": "综合评估分析" }}}}
    }}}}
}}}}

请只返回 JSON，不要其他内容。

===== 候选人简历 =====
{raw_text[:3000]}
====================
"""
    output = _call_hermes(prompt, timeout=180)
    if not output:
        return {"score": 0, "score_reason": "AI 分析暂时不可用", "summary": "", "score_detail": {}}

    result = _extract_json(output)
    if result:
        return result

    # 重试：更简短的提示
    retry_prompt = f"""JD：{jd_title}
{jd_content[:1500]}

简历：
{raw_text[:1500]}

请返回 JSON：{{"score": 0-100, "score_reason": "评价", "summary": "亮点", "score_detail": {{...}}}}
"""
    output = _call_hermes(retry_prompt)
    result = _extract_json(output)
    return result or {"score": 0, "score_reason": "解析失败", "summary": "", "score_detail": {}}
