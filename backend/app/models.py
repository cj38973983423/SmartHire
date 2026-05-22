"""SQLAlchemy ORM 模型"""

import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.database import Base

import enum


class ResumeStatus(str, enum.Enum):
    """简历状态"""
    PENDING = "pending"          # 待处理
    REVIEWED = "reviewed"        # 已查看
    SHORTLISTED = "shortlisted"  # 初步通过
    REJECTED = "rejected"        # 淘汰


class JobDescription(Base):
    """职位描述（JD）"""
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(256), nullable=False, comment="职位名称")
    department = Column(String(128), nullable=True, comment="所属部门")
    location = Column(String(128), nullable=True, comment="工作地点")
    content = Column(Text, nullable=False, comment="JD 全文")
    required_skills = Column(Text, nullable=True, comment="必备技能 (JSON array)")
    nice_to_have = Column(Text, nullable=True, comment="加分技能 (JSON array)")
    experience_required = Column(String(64), nullable=True, comment="经验要求")
    education_required = Column(String(64), nullable=True, comment="学历要求")
    summary = Column(String(512), nullable=True, comment="JD 摘要")
    is_active = Column(Integer, default=1, comment="是否启用")
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )

    # 关联：该 JD 下的评分记录
    scores = relationship("ResumeScore", back_populates="jd", passive_deletes=True)

    def __repr__(self):
        return f"<JD {self.id}: {self.title}>"


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
    score = Column(Float, nullable=True, comment="AI 匹配评分 0-100（通用或无JD时）")
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
    jd_id = Column(Integer, ForeignKey("job_descriptions.id", ondelete="SET NULL"), nullable=True, comment="关联的 JD")
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )

    # 关联
    jd = relationship("JobDescription")
    scores = relationship("ResumeScore", back_populates="resume", passive_deletes=True)

    def __repr__(self):
        return f"<Resume {self.id}: {self.name or 'Unknown'}>"


class ResumeScore(Base):
    """简历-JD 评分记录（多对多：一份简历多个 JD）"""
    __tablename__ = "resume_scores"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    jd_id = Column(Integer, ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Float, nullable=False, comment="匹配评分 0-100")
    score_reason = Column(Text, nullable=True, comment="评分理由")
    summary = Column(String(512), nullable=True, comment="候选人亮点总结")
    score_detail = Column(Text, nullable=True, comment="详细评分维度分析 (JSON)")
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    resume = relationship("Resume", back_populates="scores")
    jd = relationship("JobDescription", back_populates="scores")

    def __repr__(self):
        return f"<ResumeScore #{self.id}: resume={self.resume_id} × jd={self.jd_id} = {self.score}>"
