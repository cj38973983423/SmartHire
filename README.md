# 🤖 SmartHire — AI 招聘助手

> 基于 Hermes Agent 的智能简历初筛系统 — Web 前端 + FastAPI 后端，AI 辅助 HR 快速筛选候选人。

## 快速开始

👉 **零基础用户请看 [TUTORIAL.md](TUTORIAL.md)** — 从 Python/Node.js 安装到跑起来的完整教程。

```bash
# 一键启动（需要先装好 Python 和 Node.js）
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000
# 新开终端
cd frontend && npm install && npm run dev
# 浏览器打开 http://localhost:5173
```

## 功能

| 功能 | 说明 |
|------|------|
| 📤 简历上传 | 支持 PDF/DOCX，拖拽上传 |
| 🤖 AI 自动解析 | Hermes Agent 提取姓名/技能/经验等结构化信息 |
| 🔍 搜索筛选 | 按关键词、技能、状态、评分多维度搜索 |
| 📊 AI 评分 | 根据职位关键词自动匹配打分，输出评分理由 |
| 👨‍💼 人工决策 | HR 标记状态（待处理/已查看/初步通过/淘汰）+ 备注 |
| 📈 数据看板 | 总览统计，一目了然 |

## 快速开始

### 后端

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

浏览器打开 http://localhost:5173

### 前提条件

- Python 3.10+
- Node.js 18+
- 本地安装并配置 [Hermes Agent](https://hermes-agent.nousresearch.com)
- （可选）GitHub 账号用于代码托管

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React + TypeScript + Vite + Ant Design |
| 后端 | Python 3.11 + FastAPI + SQLAlchemy + SQLite |
| AI 引擎 | Hermes Agent (subprocess) |
| 部署 | Uvicorn + Nginx（推荐） |

## 项目结构

```
hr-recruiter/
├── frontend/          # React 前端
│   └── src/
│       ├── api/       # API 客户端
│       ├── pages/     # 页面组件
│       └── App.tsx    # 路由 + 布局
├── backend/           # FastAPI 后端
│   └── app/
│       ├── routers/   # API 路由
│       ├── services/  # 业务逻辑 + Hermes 集成
│       ├── models.py  # 数据模型
│       └── main.py    # 入口
├── uploads/           # 简历文件
├── docs/              # 文档
└── scripts/           # 工具脚本
```

## 扩展方向

- [ ] JD 职位管理 + 自动匹配
- [ ] 面试题智能生成
- [ ] 批量导入/导出（Excel）
- [ ] 多用户权限管理
- [ ] 对接招聘平台 API

## 协议

MIT
