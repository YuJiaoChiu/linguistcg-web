#!/bin/bash

# LinguistCG 启动脚本

set -e

echo "🚀 启动 LinguistCG Web..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: 未检测到 Docker，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ 错误: 未检测到 docker-compose，请先安装"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p dictionaries uploads processed

# 检查字典文件是否存在
if [ ! -f "dictionaries/correction.json" ]; then
    echo "⚠️  警告: 修正规则库不存在，将使用空字典"
fi

if [ ! -f "dictionaries/shielding.json" ]; then
    echo "⚠️  警告: 保护词库不存在，将使用空字典"
fi

# 启动服务
echo "🐳 启动 Docker 容器..."
docker-compose up -d

echo ""
echo "✅ LinguistCG Web 已启动!"
echo ""
echo "📍 访问地址:"
echo "   - 前端界面: http://localhost:3000"
echo "   - API 文档: http://localhost:8000/docs"
echo "   - 健康检查: http://localhost:8000/health"
echo ""
echo "💡 提示:"
echo "   - 查看日志: docker-compose logs -f"
echo "   - 停止服务: docker-compose down"
echo "   - 重启服务: docker-compose restart"
echo ""
