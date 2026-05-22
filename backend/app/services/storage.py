"""文件存储管理"""

import os
import uuid
import aiofiles
from pathlib import Path

from fastapi import UploadFile, HTTPException

from app.config import settings


ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc"}


async def save_upload_file(file: UploadFile) -> str:
    """保存上传文件到 uploads 目录，返回相对路径"""
    # 检查文件扩展名
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件格式: {ext}，仅支持 {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # 检查文件大小
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > settings.max_upload_size_mb:
        raise HTTPException(
            status_code=400,
            detail=f"文件过大 ({size_mb:.1f}MB)，最大允许 {settings.max_upload_size_mb}MB",
        )

    # 生成唯一文件名，避免冲突
    unique_name = f"{uuid.uuid4().hex}{ext}"
    relative_path = unique_name
    abs_path = os.path.join(settings.upload_dir, unique_name)

    # 确保目录存在
    os.makedirs(settings.upload_dir, exist_ok=True)

    # 写入文件
    async with aiofiles.open(abs_path, "wb") as f:
        await f.write(contents)

    return relative_path


def extract_text_from_pdf(file_path: str) -> str:
    """从 PDF 提取纯文本"""
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(file_path)
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        return text.strip()
    except Exception as e:
        return f"[PDF 解析失败: {e}]"


def extract_text_from_docx(file_path: str) -> str:
    """从 DOCX 提取纯文本"""
    try:
        from docx import Document
        doc = Document(file_path)
        text = "\n".join(p.text for p in doc.paragraphs)
        return text.strip()
    except Exception as e:
        return f"[DOCX 解析失败: {e}]"


def extract_text(file_path: str, file_type: str) -> str:
    """根据文件类型提取文本"""
    abs_path = os.path.join(settings.upload_dir, file_path)
    if not os.path.exists(abs_path):
        return ""

    if file_type == "pdf":
        return extract_text_from_pdf(abs_path)
    elif file_type in ("docx", "doc"):
        return extract_text_from_docx(abs_path)
    return ""
