# LinguistCG Web

<div align="center">

![LinguistCG Logo](https://img.shields.io/badge/LinguistCG-Professional%20Subtitle%20Toolkit-blue?style=for-the-badge)

**专为 CG 字幕组打造的智能字幕后期修正工具**

一款基于 Web 的高性能 SRT 字幕处理系统，通过"长词优先"算法与"保护词隔离"机制，自动修正机翻错误、剔除 ASR 噪音。

[功能特性](#功能特性) • [快速开始](#快速开始) • [技术栈](#技术栈) • [使用指南](#使用指南)

</div>

---

## ✨ 功能特性

### 🎯 核心功能

- **智能双引擎字典系统**
  - 修正规则库：专业术语映射、ASR 纠错、噪音清洗
  - 保护词库：自动隔离不需修正的专有名词

- **长词优先算法**
  - 确保 `Effective Path` → `有效路径`，而非 `Effective 路径`
  - 智能边界匹配，避免误拆分

- **可视化差异比对**
  - 行内并列展示修改前后对比
  - 红色删除线标记错误，绿色加粗显示修正

- **批量递归处理**
  - 支持拖入整个文件夹，自动保持目录结构
  - 多线程异步处理，高效处理数百个文件

### 🎨 设计亮点

- **macOS Sonoma 风格界面**
  - 毛玻璃特效（Backdrop Blur）
  - 响应式三栏架构
  - 300ms 平滑过渡动画

- **实时统计大屏**
  - 可视化柱状图展示命中次数
  - Top 10 高频替换术语列表

---

## 🚀 快速开始

### 使用 Docker（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/linguistcg-web.git
cd linguistcg-web

# 2. 启动服务
docker-compose up -d

# 3. 访问应用
open http://localhost:3000
```

### 本地开发

**前置要求：**
- Node.js 18+
- Python 3.11+
- pnpm（推荐）或 npm

**前端启动：**
```bash
cd frontend
pnpm install
pnpm dev
```

**后端启动：**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## 🛠 技术栈

| 维度 | 技术选型 | 说明 |
|------|---------|------|
| **前端框架** | Next.js 14 (React) | App Router + Server Components |
| **样式/UI** | Tailwind CSS + Shadcn UI | 极简设计系统 |
| **状态管理** | Zustand | 轻量级状态库 |
| **后端引擎** | FastAPI (Python) | 异步处理 + 高性能文本匹配 |
| **容器化** | Docker + Nginx | 一键部署 |

---

## 📖 使用指南

### 1️⃣ 上传字幕文件

支持两种方式：
- 拖拽单个 `.srt` 文件
- 拖拽整个文件夹（自动递归扫描）

### 2️⃣ 选择处理模式

- **快速修正**：应用预设字典
- **自定义规则**：在线编辑字典后处理

### 3️⃣ 查看修正结果

- 左侧：原始字幕
- 右侧：修正后字幕
- 高亮：修改的专业术语

### 4️⃣ 导出与下载

- 单文件下载
- 批量打包下载（保持目录结构）

---

## 📁 项目结构

```
linguistcg-web/
├── frontend/              # Next.js 前端应用
│   ├── app/              # App Router 页面
│   ├── components/       # UI 组件
│   ├── lib/              # 工具函数
│   └── public/           # 静态资源
├── backend/              # FastAPI 后端服务
│   ├── app/
│   │   ├── core/        # 核心算法引擎
│   │   ├── api/         # API 路由
│   │   └── models/      # 数据模型
│   └── requirements.txt
├── dictionaries/         # 字典数据存储
│   ├── correction.json  # 修正规则库
│   ├── shielding.json   # 保护词库
│   └── samples/         # 示例字典
├── docker-compose.yml
└── README.md
```

---

## 🔧 字典配置

### 修正规则库示例 (`dictionaries/correction.json`)

```json
{
  "terms": [
    {
      "source": "F曲线",
      "target": "函数曲线",
      "category": "术语映射"
    },
    {
      "source": "MatShift",
      "target": "材质变换",
      "category": "ASR纠错"
    }
  ],
  "noise_patterns": [
    "\\(音乐\\)",
    "\\(哼哼\\)",
    "\\[\\s*\\]"
  ]
}
```

### 保护词库示例 (`dictionaries/shielding.json`)

```json
{
  "protected_words": [
    "Octane",
    "Houdini",
    "Redshift",
    "Arnold"
  ]
}
```

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 开源协议

本项目采用 MIT 协议开源 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

感谢所有为 CG 字幕事业贡献的译者和工具开发者！

---

<div align="center">

Made with ❤️ for CG Subtitle Community

</div>
