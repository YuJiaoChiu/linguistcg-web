"""
字幕处理器 - 整合引擎和 SRT 解析
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, Tuple

from .engine import SubtitleEngine, create_engine_from_dicts, ReplacementStats
from .srt_parser import SRTProcessor
from .config import settings

logger = logging.getLogger(__name__)


class SubtitleProcessor:
    """完整的字幕处理流程"""

    def __init__(
        self,
        correction_dict_path: Path = None,
        shielding_dict_path: Path = None
    ):
        """
        初始化处理器

        Args:
            correction_dict_path: 修正规则字典路径
            shielding_dict_path: 保护词字典路径
        """
        self.correction_dict_path = correction_dict_path or settings.CORRECTION_DICT_PATH
        self.shielding_dict_path = shielding_dict_path or settings.SHIELDING_DICT_PATH

        # 加载字典
        self.correction_dict = self._load_json(self.correction_dict_path)
        self.shielding_dict = self._load_json(self.shielding_dict_path)

        # 创建引擎
        self.engine = create_engine_from_dicts(
            self.correction_dict,
            self.shielding_dict
        )

        logger.info("字幕处理器初始化完成")

    def process_file(self, srt_content: str) -> Tuple[str, Dict[str, Any]]:
        """
        处理单个 SRT 文件

        Args:
            srt_content: SRT 文件内容

        Returns:
            (处理后的内容, 处理报告)
        """
        logger.info("开始处理 SRT 文件")

        # 创建 SRT 处理器
        srt_processor = SRTProcessor(srt_content)

        # 累计统计数据
        accumulated_stats = {
            'total_replacements': 0,
            'term_corrections': 0,
            'noise_removals': 0,
            'replacement_details': []
        }

        # 应用字幕替换引擎，并累计统计
        def transform_func(text: str) -> str:
            processed_text, stats = self.engine.process(text)
            # 累计统计
            accumulated_stats['total_replacements'] += stats.total_replacements
            accumulated_stats['term_corrections'] += stats.term_corrections
            accumulated_stats['noise_removals'] += stats.noise_removals
            accumulated_stats['replacement_details'].extend(stats.replacement_details)
            return processed_text

        srt_processor.apply_text_transform(transform_func)

        # 获取处理后的内容
        modified_content = srt_processor.get_modified_content()

        # 合并相同 source 的替换详情
        merged_details = {}
        for detail in accumulated_stats['replacement_details']:
            source = detail.get('source', '')
            if source in merged_details:
                merged_details[source]['count'] += detail.get('count', 0)
            else:
                merged_details[source] = detail.copy()

        # 生成处理报告
        report = {
            'srt_stats': srt_processor.get_statistics(),
            'diff_data': srt_processor.get_diff_data(),
            'replacement_stats': {
                'total_replacements': accumulated_stats['total_replacements'],
                'term_corrections': accumulated_stats['term_corrections'],
                'noise_removals': accumulated_stats['noise_removals'],
                'top_replacements': self._get_top_replacements(
                    list(merged_details.values())
                )
            }
        }

        logger.info(
            f"处理完成: 修改 {report['srt_stats']['modified_entries']} 条字幕, "
            f"替换 {accumulated_stats['total_replacements']} 次"
        )

        return modified_content, report

    def _load_json(self, file_path: Path) -> Dict[str, Any]:
        """加载 JSON 文件"""
        try:
            if not file_path.exists():
                logger.warning(f"字典文件不存在: {file_path}")
                return {}

            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)

        except Exception as e:
            logger.error(f"加载字典文件失败 {file_path}: {e}")
            return {}

    @staticmethod
    def _get_top_replacements(
        replacement_details: list,
        top_n: int = 10
    ) -> list:
        """获取替换次数最多的前 N 项"""
        # 按替换次数降序排序
        sorted_details = sorted(
            replacement_details,
            key=lambda x: x.get('count', 0),
            reverse=True
        )

        return sorted_details[:top_n]


def create_default_processor() -> SubtitleProcessor:
    """创建默认配置的处理器"""
    return SubtitleProcessor()
