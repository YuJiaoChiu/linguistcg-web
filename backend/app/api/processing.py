"""
字幕处理 API
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
import uuid
import asyncio
import shutil
from pathlib import Path
from datetime import datetime

from app.core.config import settings
from app.core.processor import create_default_processor
from app.core.stats_manager import record_replacements

router = APIRouter()
logger = logging.getLogger(__name__)

# 存储任务状态的字典
tasks: Dict[str, Dict[str, Any]] = {}


class FileInfo(BaseModel):
    """文件信息"""
    file_id: str
    filename: str  # 原始文件名


class ProcessRequest(BaseModel):
    """处理请求模型"""
    file_ids: List[str] = []  # 保持向后兼容
    files: List[FileInfo] = []  # 新格式：包含文件名
    use_correction: bool = True
    use_shielding: bool = True
    use_noise_removal: bool = True


class ProcessResponse(BaseModel):
    """处理响应模型"""
    task_id: str
    status: str
    message: str


async def process_files_task(task_id: str, file_infos: List[Dict[str, str]], options: ProcessRequest):
    """后台处理文件任务

    Args:
        task_id: 任务ID
        file_infos: 文件信息列表 [{"file_id": "...", "filename": "..."}]
        options: 处理选项
    """
    try:
        logger.info(f"任务 {task_id}: 开始处理 {len(file_infos)} 个文件")

        # 更新任务状态
        tasks[task_id]["status"] = "processing"
        tasks[task_id]["total_files"] = len(file_infos)

        # 创建处理器
        processor = create_default_processor()

        # 确保处理输出目录和备份目录存在
        settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
        settings.BACKUP_DIR.mkdir(parents=True, exist_ok=True)

        processed_files = []
        total_stats = {
            "total_replacements": 0,
            "term_corrections": 0,
            "noise_removals": 0,
            "replacement_details": []
        }

        for idx, file_info in enumerate(file_infos):
            file_id = file_info["file_id"]
            original_filename = file_info.get("filename", f"{file_id}.srt")
            try:
                # 读取原始文件
                input_path = settings.UPLOADS_DIR / f"{file_id}.srt"

                if not input_path.exists():
                    logger.error(f"文件不存在: {input_path}")
                    continue

                with open(input_path, 'r', encoding='utf-8') as f:
                    srt_content = f.read()

                # 备份原始文件
                backup_filename = f"{file_id}_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.srt"
                backup_path = settings.BACKUP_DIR / backup_filename
                shutil.copy(input_path, backup_path)
                logger.info(f"已备份原始文件: {backup_path}")

                # 处理文件
                modified_content, report = processor.process_file(srt_content)

                # 保存处理后的文件
                output_path = settings.PROCESSED_DIR / f"{file_id}_processed.srt"
                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(modified_content)

                # 累计统计信息
                stats = report.get('replacement_stats', {})
                total_stats["total_replacements"] += stats.get("total_replacements", 0)
                total_stats["term_corrections"] += stats.get("term_corrections", 0)
                total_stats["noise_removals"] += stats.get("noise_removals", 0)
                total_stats["replacement_details"].extend(stats.get("top_replacements", []))

                # 记录到历史统计
                if stats.get("top_replacements"):
                    record_replacements(stats.get("top_replacements", []))

                processed_files.append({
                    "file_id": file_id,
                    "filename": original_filename,  # 保存原始文件名
                    "input_path": str(input_path),
                    "output_path": str(output_path),
                    "statistics": stats,
                    "diff_data": report.get('diff_data', [])
                })

                # 更新进度
                tasks[task_id]["processed_files"] = idx + 1
                tasks[task_id]["progress"] = int((idx + 1) / len(file_infos) * 100)

                logger.info(f"任务 {task_id}: 完成文件 {idx + 1}/{len(file_infos)}")

            except Exception as e:
                logger.error(f"处理文件 {file_id} 时出错: {str(e)}", exc_info=True)
                continue

        # 获取最高频替换词（前10个）
        replacement_details = total_stats["replacement_details"]
        replacement_counts = {}
        for detail in replacement_details:
            source = detail.get('source', '')
            if source:
                replacement_counts[source] = replacement_counts.get(source, 0) + detail.get('count', 0)

        top_replacements = sorted(
            [{"source": k, "count": v} for k, v in replacement_counts.items()],
            key=lambda x: x['count'],
            reverse=True
        )[:10]

        # 更新最终任务状态
        tasks[task_id]["status"] = "completed"
        tasks[task_id]["progress"] = 100
        tasks[task_id]["files"] = processed_files
        tasks[task_id]["statistics"] = {
            "total_replacements": total_stats["total_replacements"],
            "term_corrections": total_stats["term_corrections"],
            "noise_removals": total_stats["noise_removals"],
            "top_replacements": top_replacements
        }

        logger.info(f"任务 {task_id}: 全部完成，共处理 {len(processed_files)} 个文件")

    except Exception as e:
        logger.error(f"任务 {task_id} 失败: {str(e)}", exc_info=True)
        tasks[task_id]["status"] = "failed"
        tasks[task_id]["error"] = str(e)


@router.post("/start", response_model=ProcessResponse)
async def start_processing(request: ProcessRequest):
    """
    开始处理字幕文件
    返回任务 ID 用于后续查询
    """
    # 构建文件信息列表（兼容旧格式）
    file_infos = []
    if request.files:
        # 新格式：包含文件名
        file_infos = [{"file_id": f.file_id, "filename": f.filename} for f in request.files]
    elif request.file_ids:
        # 旧格式：只有 file_id，文件名使用默认值
        file_infos = [{"file_id": fid, "filename": f"{fid}.srt"} for fid in request.file_ids]

    if not file_infos:
        raise HTTPException(status_code=400, detail="没有提供要处理的文件")

    logger.info(f"开始处理 {len(file_infos)} 个文件")

    # 生成任务ID
    task_id = str(uuid.uuid4())

    # 初始化任务状态
    tasks[task_id] = {
        "task_id": task_id,
        "status": "pending",
        "progress": 0,
        "processed_files": 0,
        "total_files": len(file_infos),
        "files": [],
        "statistics": {}
    }

    # 在后台启动处理任务
    asyncio.create_task(process_files_task(task_id, file_infos, request))

    return ProcessResponse(
        task_id=task_id,
        status="processing",
        message=f"已开始处理 {len(file_infos)} 个文件"
    )


@router.get("/status/{task_id}")
async def get_processing_status(task_id: str):
    """获取处理任务状态"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="任务不存在")

    task = tasks[task_id]
    return {
        "task_id": task_id,
        "status": task["status"],
        "progress": task["progress"],
        "processed_files": task["processed_files"],
        "total_files": task["total_files"]
    }


@router.get("/result/{task_id}")
async def get_processing_result(task_id: str):
    """获取处理结果"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="任务不存在")

    task = tasks[task_id]

    if task["status"] != "completed":
        raise HTTPException(status_code=400, detail="任务尚未完成")

    return {
        "task_id": task_id,
        "files": task["files"],
        "statistics": task["statistics"]
    }


@router.get("/download/{file_id}")
async def download_processed_file(file_id: str):
    """下载处理后的文件"""
    from fastapi.responses import FileResponse

    file_path = settings.PROCESSED_DIR / f"{file_id}_processed.srt"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="文件不存在")

    return FileResponse(
        path=file_path,
        filename=f"{file_id}_processed.srt",
        media_type="text/plain"
    )


@router.post("/download-zip")
async def download_processed_files_zip(file_ids: List[str]):
    """批量下载处理后的文件（ZIP压缩包）"""
    import zipfile
    import io
    from fastapi.responses import StreamingResponse

    # 创建内存中的 ZIP 文件
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for file_id in file_ids:
            file_path = settings.PROCESSED_DIR / f"{file_id}_processed.srt"

            if file_path.exists():
                # 使用原始文件名（如果能找到的话）
                # 否则使用 file_id
                zip_file.write(file_path, f"{file_id}_processed.srt")
            else:
                logger.warning(f"文件不存在，跳过: {file_path}")

    zip_buffer.seek(0)

    # 生成文件名
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"corrected_subtitles_{timestamp}.zip"

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/download-zip/{task_id}")
async def download_task_zip(task_id: str):
    """根据任务ID下载所有处理后的文件（ZIP压缩包）"""
    import zipfile
    import io
    from fastapi.responses import StreamingResponse

    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="任务不存在")

    task = tasks[task_id]

    if task["status"] != "completed":
        raise HTTPException(status_code=400, detail="任务尚未完成")

    # 创建内存中的 ZIP 文件
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for file_info in task.get("files", []):
            output_path = Path(file_info.get("output_path", ""))

            if output_path.exists():
                # 使用原始文件名（保持不变）
                zip_name = file_info.get("filename", output_path.name)
                zip_file.write(output_path, zip_name)
                logger.info(f"添加到ZIP: {zip_name}")
            else:
                logger.warning(f"文件不存在，跳过: {output_path}")

    zip_buffer.seek(0)

    # 生成文件名
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"corrected_subtitles_{timestamp}.zip"

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
