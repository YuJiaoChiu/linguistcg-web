# LinguistCG 开发指南

## 🛠 本地开发环境搭建

### 前置要求

- **Node.js** 18+
- **Python** 3.11+
- **pnpm** 8+ (推荐) 或 npm
- **Docker** (可选，用于容器化部署)

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd linguistcg-web
```

### 2. 后端开发

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 启动开发服务器
python main.py
# 或
uvicorn main:app --reload --port 8000
```

后端服务将运行在 `http://localhost:8000`

- API 文档: http://localhost:8000/docs
- 交互式 API: http://localhost:8000/redoc

### 3. 前端开发

```bash
cd frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

前端服务将运行在 `http://localhost:3000`

---

## 📁 项目结构详解

```
linguistcg-web/
├── frontend/                   # Next.js 前端
│   ├── app/                   # App Router 页面
│   │   ├── layout.tsx        # 根布局
│   │   ├── page.tsx          # 首页
│   │   └── globals.css       # 全局样式
│   ├── components/            # 组件目录
│   │   ├── features/         # 功能组件
│   │   │   ├── FileUploader.tsx
│   │   │   ├── DiffViewer.tsx
│   │   │   ├── FileTree.tsx
│   │   │   └── StatsPanel.tsx
│   │   └── ui/               # UI 基础组件
│   ├── lib/                   # 工具函数
│   └── package.json
│
├── backend/                    # FastAPI 后端
│   ├── app/
│   │   ├── api/              # API 路由
│   │   │   ├── files.py      # 文件管理
│   │   │   ├── processing.py # 字幕处理
│   │   │   └── dictionaries.py # 字典管理
│   │   ├── core/             # 核心模块
│   │   │   ├── config.py     # 配置
│   │   │   ├── engine.py     # 替换引擎 ⭐
│   │   │   ├── srt_parser.py # SRT 解析器
│   │   │   └── processor.py  # 处理器集成
│   │   ├── models/           # 数据模型
│   │   ├── schemas/          # Pydantic Schemas
│   │   └── utils/            # 工具函数
│   ├── tests/                # 测试
│   ├── main.py               # 应用入口
│   └── requirements.txt
│
├── dictionaries/              # 字典数据
│   ├── correction.json       # 修正规则库
│   └── shielding.json        # 保护词库
│
├── docker-compose.yml
├── nginx.conf
└── README.md
```

---

## 🔧 核心算法说明

### 字幕替换引擎 (`backend/app/core/engine.py`)

引擎执行以下**流水线**逻辑：

#### 步骤 A: 保护词锚点化 (Isolating)

```python
# 原文: "Octane is the best renderer"
# 处理后: "##_SHIELD_abc123_## is the best renderer"
```

将保护词替换为唯一占位符，防止被误修改。

#### 步骤 B: 优先级排序 (Priority Sorting)

```python
# 按 source 长度降序排序
terms = sorted(terms, key=lambda x: len(x['source']), reverse=True)
```

确保长词优先匹配，避免：
- ❌ `Path` 先匹配，导致 `Effective Path` → `Effective 路径`
- ✅ `Effective Path` 先匹配 → `有效路径`

#### 步骤 C: 正则边界匹配 (Word Boundary)

```python
# 英文单词使用边界符
pattern = r'\bKeyframe\b'  # 只匹配完整单词

# 中文或混合不使用边界符
pattern = r'F曲线'
```

#### 步骤 D: 降噪与还原 (Purge & Restore)

1. 移除噪音标记: `(音乐)`, `(哼哼)` 等
2. 还原保护词: `##_SHIELD_abc123_## → Octane`

---

## 🧪 测试

### 后端测试

```bash
cd backend
pytest tests/ -v
```

### 前端测试

```bash
cd frontend
pnpm test
```

---

## 🐳 Docker 部署

### 使用启动脚本（推荐）

```bash
./start.sh
```

### 手动启动

```bash
docker-compose up -d
```

### 查看日志

```bash
docker-compose logs -f
```

### 停止服务

```bash
docker-compose down
```

---

## 📝 API 端点

### 文件管理

- `POST /api/files/upload` - 上传字幕文件
- `GET /api/files/list` - 获取文件列表
- `DELETE /api/files/{file_id}` - 删除文件

### 字幕处理

- `POST /api/processing/start` - 开始处理
- `GET /api/processing/status/{task_id}` - 查询状态
- `GET /api/processing/result/{task_id}` - 获取结果

### 字典管理

- `GET /api/dictionaries/correction` - 获取修正规则
- `PUT /api/dictionaries/correction` - 更新修正规则
- `GET /api/dictionaries/shielding` - 获取保护词
- `PUT /api/dictionaries/shielding` - 更新保护词
- `GET /api/dictionaries/stats` - 获取统计

---

## 🎨 前端组件开发

### 添加新组件

```bash
cd frontend/components/features
```

创建新组件 `MyComponent.tsx`:

```tsx
'use client'

export function MyComponent() {
  return (
    <div className="glass-panel rounded-lg p-4">
      {/* Your content */}
    </div>
  )
}
```

### 使用 Tailwind 样式类

项目预设了以下工具类：

- `glass-panel` - 毛玻璃卡片
- `glass-sidebar` - 侧边栏毛玻璃
- `glass-navbar` - 导航栏毛玻璃
- `transition-smooth` - 平滑过渡动画
- `custom-scrollbar` - 自定义滚动条

---

## 🔐 环境变量

### 后端 `.env`

```env
ENVIRONMENT=development
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 前端 `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📚 参考资料

- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com/)

---

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交 Pull Request

---

## 📄 License

MIT License
