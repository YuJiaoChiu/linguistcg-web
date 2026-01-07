"""
LinguistCG Backend - FastAPI Application
专为 CG 字幕组打造的智能字幕后期修正工具
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.api import files, processing, dictionaries
from app.core.config import settings

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    logger.info("🚀 LinguistCG Backend 启动中...")
    logger.info(f"📁 字典目录: {settings.DICTIONARIES_DIR}")
    logger.info(f"📤 上传目录: {settings.UPLOADS_DIR}")

    # 确保必要的目录存在
    settings.DICTIONARIES_DIR.mkdir(parents=True, exist_ok=True)
    settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    yield

    logger.info("👋 LinguistCG Backend 关闭中...")


# 创建 FastAPI 应用
app = FastAPI(
    title="LinguistCG API",
    description="专业字幕后期修正工具 API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 健康检查端点
@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "service": "LinguistCG Backend"
    }


# 根路由
@app.get("/")
async def root():
    """API 根路由"""
    return {
        "message": "LinguistCG API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


# 注册 API 路由
app.include_router(
    files.router,
    prefix="/api/files",
    tags=["文件管理"]
)

app.include_router(
    processing.router,
    prefix="/api/processing",
    tags=["字幕处理"]
)

app.include_router(
    dictionaries.router,
    prefix="/api/dictionaries",
    tags=["字典管理"]
)


# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """全局异常处理器"""
    logger.error(f"未处理的异常: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc)
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
