# 🤖 SmartHire — AI 智能招聘助手

<p align="center">
  <strong>基于大语言模型的智能简历初筛系统</strong><br>
  AI 辅助 HR 从海量简历中快速锁定高匹配度候选人
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11-blue?logo=python" alt="Python">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/SQLAlchemy-2.0-red" alt="SQLAlchemy">
  <img src="https://img.shields.io/badge/Ant_Design-5-1677FF?logo=antdesign" alt="Ant Design">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome">
</p>

---

## ✨ 功能一览

| 功能 | 说明 |
|------|------|
| 📤 **批量上传简历** | 支持 PDF/DOCX，多选文件或拖拽整个文件夹 |
| 🤖 **AI 自动解析** | 上传后自动提取姓名、技能、工作年限、教育经历等结构化信息 |
| 📋 **JD 职位管理** | 创建职位描述，定义岗位要求，支持启停控制 |
| 🧠 **AI 四维度评分** | 基于 JD 全文从**技能 40% / 经验 30% / 教育 15% / 综合 15%** 综合打分 |
| ⭐ **待筛选区（≥60分）** | 高分候选人自动归类，按分数排序优先查看 |
| 🗑️ **淘汰库（<60分）** | 低分候选人自动归入，不遗漏 |
| 📊 **数据看板** | 总览统计，招聘进度一目了然 |
| 👨‍💼 **人工决策** | HR 标记通过 / 淘汰，支持添加备注 |

---

## 🚀 快速开始

### 前提条件

- Python 3.10+
- Node.js 18+
- [Hermes Agent](https://hermes-agent.nousresearch.com)（AI 引擎，需配置 API Key）

### 一键启动

```bash
# 1. 克隆项目
git clone https://github.com/cj38973983423/SmartHire.git
cd SmartHire

# 2. 启动后端
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 3. 新开终端，启动前端
cd frontend
npm install
npm run dev
```

浏览器打开 **http://localhost:5173** 🎉

> 👉 **零基础用户？** 请查看 [TUTORIAL.md](TUTORIAL.md) — 从 Python 安装到完整使用的手把手图文教程

---

## 🛠 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | React 18 + TypeScript + Vite 5 + Ant Design 5 | 类型安全，极速开发 |
| **后端** | Python 3.11 + FastAPI + SQLAlchemy 2.0 | 高性能异步框架 |
| **数据库** | SQLite → 可无缝切换 PostgreSQL | 零配置开箱即用 |
| **AI 引擎** | Hermes Agent (DeepSeek / OpenAI) | 本地 subprocess 调用 |
| **文档解析** | PyPDF2 + python-docx | PDF & DOCX 文本提取 |
| **CI/CD** | GitHub Actions | 自动 lint + 构建 |

---

## 📖 文档

| 文档 | 说明 |
|------|------|
| [TUTORIAL.md](TUTORIAL.md) | 🔥 **零基础上手指南** — 从环境安装到完整使用 |
| [RESUME-PROJECT.md](RESUME-PROJECT.md) | 📋 **简历项目描述** — 可直接用于简历编写 |
| [docs/architecture.md](docs/architecture.md) | 🏗 **系统架构文档** — 架构图 + 数据模型 + 流程设计 |

---

## 🏗 项目结构

```
SmartHire/
├── frontend/           # React 前端
│   └── src/
│       ├── api/        # API 客户端 (Axios)
│       ├── pages/      # 6 个页面组件
│       └── App.tsx     # 路由 + 侧边栏布局
├── backend/            # FastAPI 后端
│   └── app/
│       ├── routers/    # 3 组 API 路由 (16+ 接口)
│       ├── services/   # Hermes 集成 + 文件存储
│       └── models.py   # 3 张数据表
├── docs/               # 文档
└── uploads/            # 简历文件
```

---

## 🎯 API 概览

| 方法 | 路径 | 功能 |
|------|------|------|
| `POST` | `/api/resumes` | 上传单份简历 |
| `POST` | `/api/resumes/batch` | 批量上传简历 |
| `GET` | `/api/resumes` | 简历列表（搜索/筛选/排序/分页） |
| `GET` | `/api/resumes/{id}` | 简历详情 |
| `PATCH` | `/api/resumes/{id}/status` | 更新简历状态+备注 |
| `DELETE` | `/api/resumes/{id}` | 删除简历 |
| `POST` | `/api/jds` | 创建 JD |
| `GET` | `/api/jds` | JD 列表 |
| `GET` | `/api/jds/{id}` | JD 详情 |
| `PUT` | `/api/jds/{id}` | 更新 JD |
| `DELETE` | `/api/jds/{id}` | 删除 JD |
| `POST` | `/api/analyze/score` | AI 评分（单份） |
| `POST` | `/api/analyze/score-batch` | 批量 AI 评分 |
| `GET` | `/api/analyze/scores/{id}` | 评分历史 |
| `GET` | `/api/health` | 健康检查 |
| `GET` | `/api/stats` | 仪表盘统计 |

完整 API 文档请访问：`http://localhost:8000/docs`（Swagger UI）

---

## 🔧 扩展方向

- [ ] 面试题智能生成（基于 JD + 简历自动出题）
- [ ] 批量导出评分报告（Excel / PDF）
- [ ] 简历评分可视化雷达图
- [ ] 多用户权限管理（HR 团队协作）
- [ ] 对接招聘平台 API（Boss 直聘 / 拉勾等）
- [ ] 部署方案（Docker / Nginx 反向代理）

---

## 📄 协议

[MIT License](LICENSE)

---

<p align="center">
  💡 觉得有用？点亮 ⭐ Star 支持一下！
</p>
