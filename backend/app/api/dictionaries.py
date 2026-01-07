"""
字典管理 API
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import json
import logging

from app.core.config import settings
from app.core.stats_manager import get_overall_stats, get_top_terms

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/correction")
async def get_correction_dictionary() -> Dict[str, Any]:
    """获取修正规则库"""
    try:
        if settings.CORRECTION_DICT_PATH.exists():
            with open(settings.CORRECTION_DICT_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            raise HTTPException(
                status_code=404,
                detail="修正规则库不存在"
            )
    except Exception as e:
        logger.error(f"读取修正规则库失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/shielding")
async def get_shielding_dictionary() -> Dict[str, Any]:
    """获取保护词库"""
    try:
        if settings.SHIELDING_DICT_PATH.exists():
            with open(settings.SHIELDING_DICT_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            raise HTTPException(
                status_code=404,
                detail="保护词库不存在"
            )
    except Exception as e:
        logger.error(f"读取保护词库失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/correction")
async def update_correction_dictionary(data: Dict[str, Any]):
    """更新修正规则库"""
    try:
        with open(settings.CORRECTION_DICT_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        logger.info("修正规则库已更新")
        return {"success": True, "message": "修正规则库已更新"}

    except Exception as e:
        logger.error(f"更新修正规则库失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/shielding")
async def update_shielding_dictionary(data: Dict[str, Any]):
    """更新保护词库"""
    try:
        with open(settings.SHIELDING_DICT_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        logger.info("保护词库已更新")
        return {"success": True, "message": "保护词库已更新"}

    except Exception as e:
        logger.error(f"更新保护词库失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_dictionary_stats():
    """获取字典统计信息"""
    try:
        correction_count = 0
        shielding_count = 0
        noise_patterns = 0

        if settings.CORRECTION_DICT_PATH.exists():
            with open(settings.CORRECTION_DICT_PATH, 'r', encoding='utf-8') as f:
                correction_data = json.load(f)
                correction_count = len(correction_data.get('terms', []))
                noise_patterns = len(correction_data.get('noise_patterns', []))

        if settings.SHIELDING_DICT_PATH.exists():
            with open(settings.SHIELDING_DICT_PATH, 'r', encoding='utf-8') as f:
                shielding_data = json.load(f)
                shielding_count = len(shielding_data.get('protected_words', []))

        return {
            "correction_terms": correction_count,
            "protected_words": shielding_count,
            "noise_patterns": noise_patterns
        }

    except Exception as e:
        logger.error(f"获取字典统计失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/historical-stats")
async def get_historical_stats():
    """获取历史累计统计信息（包含高频替换词排行）"""
    try:
        return get_overall_stats()
    except Exception as e:
        logger.error(f"获取历史统计失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/top-terms")
async def get_top_replacement_terms(limit: int = 10):
    """获取高频替换词排行"""
    try:
        return {
            "top_terms": get_top_terms(limit)
        }
    except Exception as e:
        logger.error(f"获取高频词失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
