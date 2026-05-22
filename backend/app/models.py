"""SQLAlchemy ORM 模型"""

import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Enum as SAEnum
from app.database import Base

import enum


class ResumeStatus(str, enum.Enum):
    """简历状态"""
    PENDING = "pending"          # 待处理
    REVIEWED = "reviewed"        # 已查看
    SHORTLISTED = "shortlisted"  # 初步通过
    REJECTED = "rejected"        # 淘汰


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(128), index=True, nullable=True, comment="候选人姓名")
    phone = Column(String(32), nullable=True, comment="手机号")
    email = Column(String(128), nullable=True, comment="邮箱")
    skills = Column(Text, nullable=True, comment="技能列表 (JSON array)")
    experience_years = Column(Float, nullable=True, comment="工作年限")
    education = Column(Text, nullable=True, comment="教育经历 (JSON)")
    work_experience = Column(Text, nullable=True, comment="工作经历 (JSON)")
    summary = Column(Text, nullable=True, comment="AI 简历摘要")
    score = Column(Float, nullable=True, comment="AI 匹配评分 0-100")
    score_reason = Column(Text, nullable=True, comment="评分理由")
    status = Column(
        SAEnum(ResumeStatus),
        default=ResumeStatus.PENDING,
        nullable=False,
        comment="处理状态",
    )
    review_note = Column(Text, nullable=True, comment="HR 备注")
    file_path = Column(String(512), nullable=False, comment="原始简历文件路径")
    file_name = Column(String(256), nullable=False, comment="原始文件名")
    file_type = Column(String(16), nullable=False, comment="文件类型 pdf/docx")
    raw_text = Column(Text, nullable=True, comment="提取的纯文本内容")
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )

    def __repr__(self):
        return f"<Resume {self.id}: {self.name or 'Unknown'}>"
