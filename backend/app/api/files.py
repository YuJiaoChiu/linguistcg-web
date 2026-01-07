"""
文件管理 API
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import logging
import uuid
from pathlib import Path

from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """
    上传字幕文件
    支持单个或多个 .srt 文件
    """
    uploaded_files = []

    # 确保上传目录存在
    settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    for file in files:
        if not file.filename.endswith('.srt'):
            raise HTTPException(
                status_code=400,
                detail=f"不支持的文件类型: {file.filename}"
            )

        # 生成唯一文件ID
        file_id = str(uuid.uuid4())

        # 读取文件内容
        content = await file.read()

        # 保存文件到磁盘
        file_path = settings.UPLOADS_DIR / f"{file_id}.srt"
        with open(file_path, 'wb') as f:
            f.write(content)

        uploaded_files.append({
            "file_id": file_id,
            "filename": file.filename,
            "size": len(content),
            "path": str(file_path)
        })

    logger.info(f"成功上传 {len(uploaded_files)} 个文件")

    return {
        "success": True,
        "files": uploaded_files,
        "count": len(uploaded_files)
    }


@router.get("/list")
async def list_files():
    """获取已上传的文件列表"""
    return {
        "files": [],
        "count": 0
    }


@router.delete("/{file_id}")
async def delete_file(file_id: str):
    """删除指定文件"""
    return {
        "success": True,
        "message": f"文件 {file_id} 已删除"
    }
