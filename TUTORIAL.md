# 🚀 SmartHire 零基础上手指南

> 从零开始，带你跑起一个 AI 智能招聘助手！

---

## 📖 目录

1. [这是什么？](#-这是什么)
2. [准备工作](#-准备工作)
3. [下载项目](#-下载项目)
4. [启动后端](#-启动后端)
5. [启动前端](#-启动前端)
6. [第一次使用](#-第一次使用)
7. [完整工作流](#-完整工作流)
8. [常见问题](#-常见问题)

---

## 🤔 这是什么？

**SmartHire** 是一个 AI 智能简历初筛系统，帮你快速从一堆简历中找出最合适的候选人。

### 它能干啥？

| 功能 | 说明 |
|------|------|
| 📤 **批量上传简历** | 一次上传多个 PDF/DOCX，甚至整个文件夹 |
| 🤖 **AI 自动解析** | 自动提取姓名、技能、工作年限、教育经历 |
| 📋 **JD 职位管理** | 创建职位描述，定义岗位要求 |
| 🧠 **AI 综合评分** | 基于 JD 全文四维度打分：技能、经验、教育、综合 |
| ⭐ **待筛选区** | 60 分以上的候选人自动归入待筛选，按分数排序 |
| 🗑️ **淘汰库** | 60 分以下的自动归入淘汰库 |
| 👨‍💼 **人工决策** | HR 标记通过/淘汰，写备注 |

---

## 🛠 准备工作

你需要在本机安装以下东西（如果你已经装好了可以跳过）：

### 1. 安装 Python（后端需要）

**Windows：**
1. 打开 https://www.python.org/downloads/
2. 下载 Python 3.11 或 3.12
3. 安装时 **务必勾选** ☑️ "Add Python to PATH"
4. 安装完成后，打开命令提示符（CMD），输入以下命令验证：
```bash
python --version
# 应该显示 Python 3.11.x
```

**macOS：**
```bash
# 如果安装了 Homebrew
brew install python@3.11

# 验证
python3 --version
```

**Linux（Ubuntu/Debian）：**
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
python3 --version
```

### 2. 安装 Node.js（前端需要）

打开 https://nodejs.org/ ，下载 **LTS 版本**（左边那个），安装即可。

验证：
```bash
node --version
# 应该显示 v18.x 或 v20.x
npm --version
# 应该显示 9.x 或 10.x
```

### 3. 安装 Git

**下载：** https://git-scm.com/downloads

安装时全部默认选项即可。

验证：
```bash
git --version
```

### 4. 安装 Hermes Agent（AI 引擎）

SmartHire 的 AI 评分功能依赖于 Hermes Agent。

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

安装完成后，配置一个 AI 模型（需要 API Key，如 DeepSeek、OpenAI 等）：

```bash
hermes model
```

按照提示选择一个 Provider 并输入 API Key 即可。

---

## 📥 下载项目

### 方式一：直接下载 ZIP

1. 打开 https://github.com/cj38973983423/SmartHire
2. 点击绿色的 **Code** 按钮 → **Download ZIP**
3. 解压到你想放的位置，比如 `D:\SmartHire` 或 `~/SmartHire`

### 方式二：用 Git 克隆（推荐）

打开终端（命令提示符 / Terminal），输入：

```bash
git clone https://github.com/cj38973983423/SmartHire.git
cd SmartHire
```

---

## ⚙️ 启动后端

后端是 SmartHire 的大脑，负责处理数据、调用 AI。

### 第一步：进入后端目录

```bash
cd SmartHire/backend
```

### 第二步：创建虚拟环境

```bash
# Windows
python -m venv .venv

# macOS / Linux
python3 -m venv .venv
```

> 💡 虚拟环境就像一个独立的"小房间"，里面装的 Python 包不会影响你电脑上的其他项目。

### 第三步：激活虚拟环境

```bash
# Windows (CMD)
.venv\Scripts\activate

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate
```

激活成功后，你的终端前面会出现 `(.venv)` 标志。

### 第四步：安装依赖

```bash
pip install -r requirements.txt
```

看到 `Successfully installed ...` 就对了。

### 第五步：启动后端

```bash
uvicorn app.main:app --reload --port 8000
```

看到这样一行输出就说明启动成功了：

```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

> ⚠️ 这个窗口**不要关**，后端需要一直运行。后面再打开一个新终端来启动前端。

### 验证后端

打开浏览器，访问 http://localhost:8000/docs

如果看到 Swagger 页面（一个漂亮的 API 文档界面），说明后端跑起来了！✅

---

## 🖥️ 启动前端

前端就是你能看到的网页界面。

### 第一步：进入前端目录

**新开一个终端**，进入项目目录：

```bash
cd SmartHire/frontend
```

### 第二步：安装依赖

```bash
npm install
```

这会下载前端需要的所有库，大概需要 1-2 分钟。

### 第三步：启动前端

```bash
npm run dev
```

看到这样一行就说明成功了：

```
➜  Local:   http://localhost:5173
```

### 第四步：打开网页

浏览器访问 **http://localhost:5173**

你应该能看到 SmartHire 的主界面了！🎉

---

## 🎯 第一次使用

### 整体界面

左边是菜单栏，分为四个部分：

```
📋 HR 助手
├── 📊 数据看板      ← 总览统计
├── 📄 简历管理      ← 简历列表 + 筛选
├── 📋 JD 管理       ← 职位描述
└── 📤 批量上传      ← 上传简历
```

### 第一步：创建一个职位（JD）

1. 点击左侧 **「JD 管理」**
2. 点击右上角 **「新建 JD」**
3. 填写职位信息：
   - **职位名称**：如「高级 Python 工程师」
   - **所属部门**：如「技术部」
   - **工作地点**：如「北京」
   - **JD 全文**：把详细的职位描述粘贴进去（越详细，AI 评分越准）
   - **必备技能**：如 `Python, FastAPI, SQL, Redis`
4. 点击 **「创建」**

> 💡 JD 越详细，AI 评分越精准！建议至少写 100 字以上。

### 第二步：上传简历

1. 点击左侧 **「批量上传」**
2. 你可以：
   - 点击 **「选择多个文件」** 一次选多个 PDF/DOCX
   - 点击 **「选择文件夹」** 直接把整个简历文件夹丢进来
   - 直接把文件拖拽到上传区域
3. 上传后系统会自动解析每一份简历（提取姓名、技能等）

### 第三步：AI 评分

**方式一：单份评分**
1. 点击左侧 **「全部简历」**
2. 点击某份简历进入详情页
3. 在「AI 评分关键词」下方选择你刚创建的 JD
4. 点击 **「AI 智能评分」**
5. 等待几秒钟，系统会从四个维度打分

**方式二：批量评分（推荐）**
1. 在简历列表页，勾选多份简历
2. 点击顶部的 **「对选中的 N 份简历 AI 评分」**
3. 选择一个 JD
4. 点击 **「开始批量评分」**
5. 所有简历评分完成后，会显示评分结果列表

### 第四步：筛选候选人

评分完成后：

- **⭐ 待筛选（≥60分）**：点击左侧菜单 → 「简历管理」→ 「待筛选」
  - 这里按分数从高到低排列，优先看高分候选人
- **🗑️ 淘汰库（<60分）**：点击左侧菜单 → 「简历管理」→ 「淘汰库」

### 第五步：人工决策

在简历详情页，你可以：

1. 查看 AI 评分理由和简历摘要
2. 在「HR 操作」区域：
   - 添加备注
   - 标记状态：**初步通过 ✓** / **淘汰 ✗**
3. 点击 **「评分历史」** 查看该简历对不同 JD 的历史评分

---

## 🔄 完整工作流

一张图看懂全流程：

```
           ┌──────────────┐
           │ 创建 JD 职位  │
           │（写岗位要求） │
           └──────┬───────┘
                  │
           ┌──────▼───────┐
           │  批量上传简历  │
           │（PDF/DOCX）  │
           └──────┬───────┘
                  │
           ┌──────▼───────┐
           │  勾选简历 +   │
           │  选择 JD      │
           │  一键 AI 评分  │
           └──────┬───────┘
                  │
          ┌───────┴────────┐
          ▼                ▼
    ┌──────────┐    ┌──────────┐
    │ ⭐ ≥60分  │    │ 🗑️ <60分  │
    │ 待筛选区   │    │ 淘汰库    │
    │ 分数排序   │    │          │
    └────┬─────┘    └──────────┘
         │
    ┌────▼─────┐
    │ 👨‍💼 HR 看  │
    │ 详情+理由  │
    │ 做最终决策  │
    └───────────┘
```

---

## ❓ 常见问题

### Q：后端启动报错 "Port 8000 already in use"
端口被占用了。要么关掉其他占用的程序，要么换个端口：
```bash
uvicorn app.main:app --reload --port 8001
```
然后前端也要改配置，在 `frontend/vite.config.ts` 里把 `target` 改为 `http://localhost:8001`。

### Q：上传简历后没有自动解析出名字/技能
检查 Hermes Agent 是否正常运行：
```bash
hermes chat -q "hello" -Q
```
如果报错，说明 Hermes 没配置好，重新运行 `hermes model` 配置。

### Q：AI 评分按钮点了没反应
- 确认后端在运行（`curl http://localhost:8000/api/health` 返回 `ok`）
- 确认简历已经上传成功
- 确认 JD 已经创建
- 看后端终端窗口有没有报错信息

### Q：批量上传时有些文件失败了
系统只支持 **PDF** 和 **DOCX** 格式，其他格式（如 .pages、图片）会自动过滤掉。

### Q：前端页面打不开（白屏/空白）
1. 确认前端终端窗口还在运行
2. 浏览器访问 http://localhost:5173
3. 按 F12 打开开发者工具 → Console 看有没有红色报错

### Q：如何停止服务？
- 在运行后端的终端窗口按 **Ctrl + C**
- 在运行前端的终端窗口按 **Ctrl + C**

### Q：跑完关了，下次怎么再启动？
```bash
# 确保在 SmartHire 目录下
cd backend
source .venv/bin/activate    # Windows 用 .venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
# 新开终端
cd frontend
npm run dev
```

---

## 🚀 进阶技巧

### 想让评分更准？
- JD 写得更详细：职责、技术要求、软技能、加分项都写上
- 在 JD 的「必备技能」字段把关键技能写清楚
- 简历 PDF 要清晰，扫描件的识别效果较差

### 多人协作？
目前是单机版，每个人装一套就能用。后续可以对接云数据库实现团队共享。

### 想加新功能？
项目是开源的！欢迎提交 Issue 或 Pull Request：
https://github.com/cj38973983423/SmartHire

---

**Happy Hiring! 🎯**
