# 🏗 系统架构文档

> SmartHire — AI 智能招聘助手 技术架构

---

## 整体架构图

```
┌──────────────────────────────────────────────────────────────────┐
│                          用户浏览器                               │
│     React 18 + TypeScript + Ant Design 5 + Vite 5               │
│   ┌─────────┐  ┌───────────┐  ┌──────────┐  ┌────────────┐     │
│   │ 数据看板  │  │  JD管理    │  │ 简历管理   │  │  批量上传   │     │
│   │ Dashboard│  │  JD CRUD  │  │ 列表/详情  │  │  拖拽上传   │     │
│   └─────────┘  └───────────┘  └─────┬────┘  └────────────┘     │
│                                      │                           │
│                    ┌─────────────────▼──────────┐                │
│                    │    /src/api/index.ts        │                │
│                    │    Axios HTTP 客户端         │                │
│                    └─────────────────┬──────────┘                │
└──────────────────────────────────────┼──────────────────────────┘
                                       │
                              HTTP REST API
                           localhost:8000/api/*
                                       │
┌──────────────────────────────────────┼──────────────────────────┐
│                     FastAPI 后端     │                          │
│   ┌──────────────────────────────────▼────────────────────┐     │
│   │              FastAPI Application                      │     │
│   │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │     │
│   │  │ /api/resumes │  │  /api/jds    │  │/api/analyze│ │     │
│   │  │ 简历 CRUD    │  │  JD CRUD     │  │ AI 评分    │ │     │
│   │  │ 批量上传     │  │  搜索+分页   │  │ 批量评分   │ │     │
│   │  │ 状态管理     │  │  启停控制    │  │ 评分历史   │ │     │
│   │  └──────┬───────┘  └──────┬───────┘  └──────┬─────┘ │     │
│   │         │                 │                  │        │     │
│   │         └────────┬────────┘──────────────────┘        │     │
│   │                  ▼                                    │     │
│   │  ┌────────────────────────────────────────┐           │     │
│   │  │        SQLAlchemy ORM 2.0              │           │     │
│   │  │  ┌──────────────────┐  ┌────────────┐ │           │     │
│   │  │  │  job_descriptions│  │   resumes   │ │           │     │
│   │  │  ├──────────────────┤  ├────────────┤ │           │     │
│   │  │  │ id              │  │ id         │ │           │     │
│   │  │  │ title           │  │ name       │ │           │     │
│   │  │  │ department      │  │ skills     │ │           │     │
│   │  │  │ content         │  │ experience │ │           │     │
│   │  │  │ required_skills │  │ score      │ │           │     │
│   │  │  │ is_active       │  │ status     │ │           │     │
│   │  │  └──────────────────┘  └─────┬──────┘ │           │     │
│   │  │                               │       │           │     │
│   │  │  ┌────────────────────────────▼────┐ │           │     │
│   │  │  │     resume_scores               │ │           │     │
│   │  │  │  (多对多: resume × jd)          │ │           │     │
│   │  │  │  resume_id + jd_id + score      │ │           │     │
│   │  │  │  + score_detail(JSON)           │ │           │     │
│   │  │  └─────────────────────────────────┘ │           │     │
│   │  └────────────────────────────────────────┘           │     │
│   │                        │                              │     │
│   │         ┌──────────────▼──────────────┐               │     │
│   │         │        SQLite               │               │     │
│   │         │    hr_recruiter.db          │               │     │
│   │         └─────────────────────────────┘               │     │
│   │                                                        │     │
│   │         ┌──────────────────────────────┐               │     │
│   │         │   Hermes Agent (subprocess)  │               │     │
│   │         │   hermes chat -q "prompt"    │               │     │
│   │         │   └→ JSON 响应              │               │     │
│   │         └──────────────────────────────┘               │     │
│   └────────────────────────────────────────────────────────┘     │
│                                                                    │
│   文件系统                                                        │
│   ┌────────────────────────────────────────────────────┐          │
│   │  uploads/  ← 简历 PDF/DOCX 文件存储                │          │
│   └────────────────────────────────────────────────────┘          │
└────────────────────────────────────────────────────────────────────┘
```

---

## 数据模型 ER 图

```
┌───────────────────────┐       ┌───────────────────────────┐
│   job_descriptions    │       │       resumes              │
├───────────────────────┤       ├───────────────────────────┤
│ id (PK)              │       │ id (PK)                   │
│ title                │       │ name                      │
│ department           │       │ phone                     │
│ location             │       │ email                     │
│ content (TEXT)       │       │ skills (JSON)             │
│ required_skills      │       │ experience_years          │
│ nice_to_have         │       │ education                 │
│ experience_required  │       │ work_experience           │
│ education_required   │       │ summary                   │
│ summary              │       │ score (0-100)             │
│ is_active (0/1)      │       │ score_reason              │
│ created_at           │       │ status (Enum)             │
│ updated_at           │       │ review_note               │
└──────────┬────────────┘       │ file_path                │
           │                    │ file_name                │
           │                    │ file_type (pdf/docx)     │
           │                    │ raw_text (TEXT)          │
           │                    │ jd_id (FK → jd.id)       │
           │                    │ created_at               │
           │                    │ updated_at               │
           │                    └──────────┬────────────────┘
           │                               │
           │     ┌─────────────────────────┘
           │     │
           │     │  ┌──────────────────────────────┐
           │     │  │    resume_scores             │
           │     │  ├──────────────────────────────┤
           │     └──┤ resume_id (FK → resumes.id)  │
           └────────┤ jd_id (FK → jds.id)          │
                    │ score (0-100)                │
                    │ score_reason                 │
                    │ summary                      │
                    │ score_detail (JSON)          │
                    │ created_at                   │
                    └──────────────────────────────┘
```

---

## 核心流程：AI 评分

```
用户选择 JD → 勾选简历 → 发起批量评分
         │
         ▼
  POST /api/analyze/score-batch
  { resume_ids: [...], jd_id: N }
         │
         ▼
  FastAPI 接收请求
  ├─ 查询 JD 内容
  ├─ 查询所有选中简历
  │
  ▼
  for each resume:
  │
  ├─ 构建 Prompt（JD 全文 + 简历文本）
  │
  ├─ 调用 Hermes Agent (subprocess)
  │   hermes chat -q "prompt" -Q
  │
  ├─ 提取 JSON 响应 (正则 `{...}`)
  │
  ├─ 若失败 → 重试（更短提示）
  │   ↓ 仍失败 → 兜底默认值
  │
  ├─ 写入 resume_scores 表
  │   (resume_id, jd_id, score, score_detail)
  │
  └─ 更新 resume 主表最新评分
      (score, score_reason, jd_id)
         │
         ▼
  返回评分结果列表
  [{ resume_id, resume_name, score, score_reason }]
```

---

## Prompt 设计（评分核心）

```
角色: "你是一位资深的HR招聘专家"
输入: JD 全文 + 简历文本
评分维度:
  1. 技能匹配度 (40%) — 技能匹配程度
  2. 经验匹配度 (30%) — 工作经验契合度
  3. 教育背景匹配度 (15%) — 教育符合程度
  4. 综合契合度 (15%) — 整体素质匹配

输出格式 (JSON):
{
  "score": 加权总分(0-100),
  "score_reason": "综合评价（100字内，优缺点各一）",
  "summary": "候选人核心亮点（30字内）",
  "score_detail": {
    "skill_match":       {"score": 0-100, "reason": "..."},
    "experience_match":  {"score": 0-100, "reason": "..."},
    "education_match":   {"score": 0-100, "reason": "..."},
    "overall_fit":       {"score": 0-100, "reason": "..."}
  }
}

异常处理:
  1. 正则提取 -> 重试 -> 兜底 {"score": 0, ...}
  2. timeout(180s) 自动降级
```

---

## 项目目录结构

```
SmartHire/
├── README.md                    # 项目说明
├── RESUME-PROJECT.md            # 简历项目描述
├── TUTORIAL.md                  # 零基础教程
├── .gitignore
├── .github/workflows/ci.yml     # CI 工作流
│
├── backend/
│   ├── requirements.txt
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI 入口 + 路由注册
│   │   ├── config.py            # 配置管理 (pydantic-settings)
│   │   ├── database.py          # 数据库连接 + 会话管理
│   │   ├── models.py            # ORM 模型 (3 张表)
│   │   ├── schemas.py           # Pydantic 请求/响应模型
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── resumes.py       # 简历 CRUD (232行)
│   │   │   ├── jds.py           # JD CRUD (109行)
│   │   │   └── analyze.py       # AI 评分 (200行)
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── hermes_client.py # Hermes Agent 集成 (189行)
│   │       └── storage.py       # 文件存储 + 文本提取
│   └── uploads/                 # 简历文件存储
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx              # 路由 + 侧边栏布局
│       ├── api/
│       │   └── index.ts         # API 客户端 (Axios, 229行)
│       └── pages/
│           ├── Dashboard.tsx    # 数据看板 (56行)
│           ├── JDList.tsx       # JD 列表 (204行)
│           ├── JDDetail.tsx     # JD 创建/编辑 (166行)
│           ├── ResumeList.tsx   # 简历列表 + 筛选 (351行)
│           ├── ResumeDetail.tsx # 简历详情 + 评分 (279行)
│           └── UploadPage.tsx   # 批量上传 (142行)
│
└── docs/
    └── architecture.md          # 架构文档 (本文)
```

---

## 技术选型理由

| 选型 | 理由 |
|------|------|
| **FastAPI** | 异步高性能，自动 OpenAPI 文档，Pydantic 校验 |
| **SQLAlchemy 2.0** | 成熟 ORM，声明式模型，灵活查询 |
| **SQLite** | 零配置，本地开发即用，后续可无缝切换 PostgreSQL |
| **React + Vite** | 极速开发体验，TypeScript 类型安全 |
| **Ant Design** | 完善的表格/表单/布局组件，企业级 UI 质量 |
| **Hermes Agent** | 本地 LLM 调用，subprocess 模式无需额外部署 |
| **PyPDF2 + python-docx** | 轻量级文档解析，无需 LibreOffice 等外部依赖 |
