#!/bin/bash

# LinguistCG 本地开发启动脚本 - 一键启动前后端

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   LinguistCG Web 一键启动脚本        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# 检查并处理端口占用
check_and_free_port() {
    local port=$1
    local service_name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}⚠️  端口 $port 已被占用${NC}"
        echo -e "${YELLOW}正在尝试关闭占用端口的进程...${NC}"
        
        # 尝试关闭占用端口的进程
        local pid=$(lsof -ti :$port)
        if [ ! -z "$pid" ]; then
            kill -9 $pid 2>/dev/null
            sleep 1
            if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
                echo -e "${RED}❌ 无法关闭占用端口 $port 的进程，请手动关闭后重试${NC}"
                echo -e "${YELLOW}提示: 运行 'lsof -ti :$port | xargs kill -9' 手动关闭${NC}"
                exit 1
            else
                echo -e "${GREEN}✅ 已释放端口 $port${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  无法获取占用端口的进程 ID${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ 端口 $port 可用${NC}"
    fi
}

echo -e "${BLUE}🔍 检查端口占用...${NC}"
check_and_free_port 8000 "后端服务"
check_and_free_port 3000 "前端服务"
echo ""

# 检查并安装后端依赖
echo -e "${BLUE}📦 检查后端依赖...${NC}"
cd backend

if [ ! -d "venv" ]; then
    echo -e "${YELLOW}创建 Python 虚拟环境...${NC}"
    python3 -m venv venv
fi

source venv/bin/activate

# 升级 pip
echo -e "${YELLOW}升级 pip...${NC}"
pip install --quiet --upgrade pip

if ! python3 -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}安装后端依赖（这可能需要几分钟）...${NC}"
    pip install -r requirements.txt --quiet
fi

cd "$SCRIPT_DIR"
echo -e "${GREEN}✅ 后端依赖就绪${NC}"
echo ""

# 检查并安装前端依赖
echo -e "${BLUE}📦 检查前端依赖...${NC}"
cd frontend

# 设置 npm 镜像源（加速下载）
if command -v npm &> /dev/null; then
    npm config set registry https://registry.npmmirror.com 2>/dev/null || true
fi

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}安装前端依赖（这可能需要几分钟，请耐心等待）...${NC}"
    if command -v pnpm &> /dev/null; then
        pnpm install
    elif command -v npm &> /dev/null; then
        npm install
    else
        echo -e "${RED}❌ 错误: 未找到 pnpm 或 npm，请先安装 Node.js${NC}"
        exit 1
    fi
fi

cd "$SCRIPT_DIR"
echo -e "${GREEN}✅ 前端依赖就绪${NC}"
echo ""

# 清理函数
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 正在停止服务...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    # 清理子进程
    pkill -f "uvicorn main:app" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    echo -e "${GREEN}✅ 服务已停止${NC}"
    exit 0
}

# 设置退出陷阱
trap cleanup INT TERM EXIT

# 启动后端
echo -e "${GREEN}🚀 启动后端服务 (端口 8000)...${NC}"
cd backend
source venv/bin/activate
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload > /tmp/linguistcg-backend.log 2>&1 &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

# 等待后端启动
echo -e "${YELLOW}等待后端启动...${NC}"
for i in {1..10}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 后端服务已启动${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 10 ]; then
        echo -e "${YELLOW}⚠️  后端启动较慢，继续启动前端...${NC}"
    fi
done
echo ""

# 启动前端
echo -e "${GREEN}🚀 启动前端服务 (端口 3000)...${NC}"
cd frontend
if command -v pnpm &> /dev/null; then
    pnpm dev > /tmp/linguistcg-frontend.log 2>&1 &
elif command -v npm &> /dev/null; then
    npm run dev > /tmp/linguistcg-frontend.log 2>&1 &
fi
FRONTEND_PID=$!
cd "$SCRIPT_DIR"

# 等待前端启动
echo -e "${YELLOW}等待前端启动...${NC}"
sleep 5

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ LinguistCG Web 启动成功！         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📍 访问地址:${NC}"
echo -e "   🌐 前端界面: ${GREEN}http://localhost:3000${NC}"
echo -e "   📚 API 文档: ${GREEN}http://localhost:8000/docs${NC}"
echo -e "   ❤️  健康检查: ${GREEN}http://localhost:8000/health${NC}"
echo ""
echo -e "${YELLOW}💡 提示:${NC}"
echo -e "   - 按 ${RED}Ctrl+C${NC} 停止所有服务"
echo -e "   - 后端日志: ${BLUE}tail -f /tmp/linguistcg-backend.log${NC}"
echo -e "   - 前端日志: ${BLUE}tail -f /tmp/linguistcg-frontend.log${NC}"
echo ""

# 尝试打开浏览器
if command -v open &> /dev/null; then
    sleep 2
    open http://localhost:3000 2>/dev/null || true
fi

# 保持脚本运行
echo -e "${BLUE}服务运行中，按 Ctrl+C 停止...${NC}"
wait
