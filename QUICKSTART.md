# LinguistCG Web - 快速开始指南

## 🎉 欢迎使用 LinguistCG

这是一款专为 CG 字幕组打造的智能字幕后期修正工具，基于 Next.js + FastAPI 构建。

---

## ⚡ 快速开始（3 步）

### 方式一：使用 Docker（推荐）

```bash
# 1. 进入项目目录
cd linguistcg-web

# 2. 启动服务（一键启动）
./start.sh

# 3. 打开浏览器访问
open http://localhost:3000
```

### 方式二：本地开发

**后端启动：**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

**前端启动：**
```bash
cd frontend
pnpm install
pnpm dev
```

---

## 🧪 测试核心引擎

```bash
cd backend
python test_engine.py
```

这将运行一个简单的测试，验证字幕替换引擎是否正常工作。

---

## 📖 核心功能演示

### 1️⃣ 术语修正

**输入：**
```
Keyframe animation
```

**输出：**
```
关键帧 animation
```

### 2️⃣ 长词优先

**输入：**
```
Effective Path
```

**输出：**
```
有效路径  ✅ (而非 "Effective 路径")
```

### 3️⃣ 保护词隔离

**输入：**
```
Octane is the best renderer
```

**输出：**
```
Octane 是最好的渲染器  ✅ (Octane 保持不变)
```

### 4️⃣ 噪音清理

**输入：**
```
Hello world (音乐) (哼哼)
```

**输出：**
```
Hello world
```

---

## 🗂 项目结构一览

```
linguistcg-web/
├── 📁 frontend/           # Next.js 前端（macOS 风格 UI）
├── 📁 backend/            # FastAPI 后端（核心引擎）
├── 📁 dictionaries/       # 字典数据（修正规则 + 保护词）
├── 🐳 docker-compose.yml  # Docker 编排文件
├── 📄 README.md           # 项目说明
├── 📄 DEVELOPMENT.md      # 开发指南
└── 🚀 start.sh            # 一键启动脚本
```

---

## 🎨 界面预览

### 主界面布局

```
┌────────────────────────────────────────────────────────────┐
│  [Logo] LinguistCG          [字典管理] [批量处理]          │  ← 导航栏
├──────────┬─────────────────────────────┬───────────────────┤
│          │                             │                   │
│  文件树  │      差异比对编辑器          │   统计面板        │  ← 三栏布局
│          │                             │                   │
│  📄 file1│  原始 ║ 修正后              │   📊 处理统计     │
│  📄 file2│  ---  ║ ---                │   🔝 高频词       │
│  📄 file3│       ║                     │   🛡 字典状态     │
│          │                             │                   │
└──────────┴─────────────────────────────┴───────────────────┘
```

### 设计特点

- ✨ **毛玻璃特效**（Backdrop Blur）
- 🎯 **三栏响应式布局**
- 🌈 **深色模式优先**
- ⚡ **300ms 平滑动画**

---

## 🔧 自定义字典

### 修正规则库 (`dictionaries/correction.json`)

```json
{
  "terms": [
    {
      "source": "Keyframe",
      "target": "关键帧",
      "category": "术语映射"
    }
  ],
  "noise_patterns": [
    { "pattern": "\\(音乐\\)" }
  ]
}
```

### 保护词库 (`dictionaries/shielding.json`)

```json
{
  "protected_words": [
    { "word": "Octane", "category": "渲染器" },
    { "word": "Houdini", "category": "软件" }
  ]
}
```

---

## 📡 API 端点

启动服务后访问 API 文档：

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 主要端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/files/upload` | 上传字幕文件 |
| POST | `/api/processing/start` | 开始处理 |
| GET  | `/api/dictionaries/correction` | 获取修正规则 |
| GET  | `/api/dictionaries/stats` | 字典统计 |

---

## 🚧 当前状态

### ✅ 已完成

- [x] 项目基础架构
- [x] 核心替换算法引擎（保护词隔离 + 长词优先）
- [x] SRT 文件解析器
- [x] FastAPI 后端 API
- [x] Next.js 前端框架
- [x] Docker 容器化配置
- [x] 字典数据结构设计

### 🔨 待优化

- [ ] 前端文件上传功能完善
- [ ] 差异比对界面实现
- [ ] 实时预览功能
- [ ] 字典在线编辑器
- [ ] 批量处理进度条
- [ ] 统计图表可视化

---

## 🐛 已知问题

目前项目处于 **MVP 阶段**，以下功能尚未完全实现：

1. 前端文件上传需要实现实际的文件处理逻辑
2. 差异比对界面需要集成 `diff` 库
3. 字典管理界面需要开发

---

## 💡 下一步建议

### 立即可做

1. **测试引擎功能**
   ```bash
   cd backend && python test_engine.py
   ```

2. **自定义字典**
   - 编辑 `dictionaries/correction.json`
   - 添加您的专业术语

3. **启动开发服务器**
   ```bash
   # 后端
   cd backend && python main.py

   # 前端
   cd frontend && pnpm dev
   ```

### 进阶开发

1. **实现文件上传 API**
   - 参考 `backend/app/api/files.py`
   - 集成 `app.core.processor.SubtitleProcessor`

2. **开发差异比对组件**
   - 使用 `diff` 库
   - 参考 `frontend/components/features/DiffViewer.tsx`

3. **添加测试用例**
   - 后端: `backend/tests/`
   - 前端: `frontend/__tests__/`

---

## 📚 学习资源

- **核心算法**: 查看 `backend/app/core/engine.py`
- **开发指南**: 阅读 `DEVELOPMENT.md`
- **API 文档**: http://localhost:8000/docs

---

## 🤝 获取帮助

如有问题，请：

1. 查看 `DEVELOPMENT.md` 开发文档
2. 检查 Docker 日志: `docker-compose logs -f`
3. 提交 Issue

---

## ⭐ 开始探索

```bash
# 启动项目
./start.sh

# 访问应用
open http://localhost:3000

# 查看 API 文档
open http://localhost:8000/docs
```

享受使用 LinguistCG！🎬
