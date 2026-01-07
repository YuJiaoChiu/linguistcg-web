"""
历史统计管理器 - 持久化累计替换统计
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
from threading import Lock

from .config import settings

logger = logging.getLogger(__name__)

# 统计文件路径
STATS_FILE = settings.BASE_DIR / "replacement_stats.json"

# 线程锁，确保并发安全
_lock = Lock()


def _load_stats() -> Dict[str, Any]:
    """加载历史统计数据"""
    try:
        if STATS_FILE.exists():
            with open(STATS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        logger.error(f"加载统计文件失败: {e}")

    return {
        "total_files_processed": 0,
        "total_replacements": 0,
        "term_counts": {},  # {"source": count}
        "last_updated": None
    }


def _save_stats(stats: Dict[str, Any]) -> None:
    """保存统计数据"""
    try:
        stats["last_updated"] = datetime.now().isoformat()
        with open(STATS_FILE, 'w', encoding='utf-8') as f:
            json.dump(stats, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"保存统计文件失败: {e}")


def record_replacements(replacement_details: List[Dict[str, Any]]) -> None:
    """
    记录本次处理的替换统计

    Args:
        replacement_details: 替换详情列表 [{"source": "...", "target": "...", "count": N}, ...]
    """
    with _lock:
        stats = _load_stats()

        stats["total_files_processed"] += 1

        for detail in replacement_details:
            source = detail.get("source", "")
            count = detail.get("count", 0)

            if source:
                current = stats["term_counts"].get(source, 0)
                stats["term_counts"][source] = current + count
                stats["total_replacements"] += count

        _save_stats(stats)
        logger.info(f"已更新统计: 总替换 {stats['total_replacements']} 次")


def get_top_terms(limit: int = 10) -> List[Dict[str, Any]]:
    """
    获取高频替换词排行

    Args:
        limit: 返回前 N 个

    Returns:
        [{"source": "...", "count": N}, ...]
    """
    stats = _load_stats()
    term_counts = stats.get("term_counts", {})

    sorted_terms = sorted(
        [{"source": k, "count": v} for k, v in term_counts.items()],
        key=lambda x: x["count"],
        reverse=True
    )

    return sorted_terms[:limit]


def get_overall_stats() -> Dict[str, Any]:
    """获取总体统计信息"""
    stats = _load_stats()
    return {
        "total_files_processed": stats.get("total_files_processed", 0),
        "total_replacements": stats.get("total_replacements", 0),
        "unique_terms": len(stats.get("term_counts", {})),
        "last_updated": stats.get("last_updated"),
        "top_terms": get_top_terms(10)
    }


def reset_stats() -> None:
    """重置统计数据（慎用）"""
    with _lock:
        _save_stats({
            "total_files_processed": 0,
            "total_replacements": 0,
            "term_counts": {},
            "last_updated": None
        })
    logger.info("统计数据已重置")
