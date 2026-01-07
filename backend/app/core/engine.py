"""
核心字幕替换算法引擎
实现"保护词隔离 + 长词优先"机制
"""

import re
import uuid
import logging
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ReplacementStats:
    """替换统计信息"""
    total_replacements: int = 0
    term_corrections: int = 0
    noise_removals: int = 0
    replacement_details: List[Dict[str, Any]] = None

    def __post_init__(self):
        if self.replacement_details is None:
            self.replacement_details = []


class SubtitleEngine:
    """字幕处理引擎"""

    def __init__(
        self,
        correction_terms: List[Dict[str, str]],
        protected_words: List[str],
        noise_patterns: List[str]
    ):
        """
        初始化引擎

        Args:
            correction_terms: 修正规则列表 [{"source": "...", "target": "..."}]
            protected_words: 保护词列表
            noise_patterns: 噪音正则表达式列表
        """
        self.correction_terms = correction_terms
        self.protected_words = protected_words
        self.noise_patterns = noise_patterns

        # 保护词映射表 {占位符: 原始词}
        self.shield_map: Dict[str, str] = {}

        # 统计信息
        self.stats = ReplacementStats()

    def process(self, text: str) -> Tuple[str, ReplacementStats]:
        """
        处理字幕文本

        流程:
        1. 保护词锚点化 (Isolating)
        2. 优先级排序 (Priority Sorting)
        3. 正则边界匹配 (Word Boundary Regex)
        4. 降噪与还原 (Purge & Restore)

        Args:
            text: 原始字幕文本

        Returns:
            (处理后的文本, 统计信息)
        """
        logger.info("开始处理字幕文本")

        # 重置统计信息
        self.stats = ReplacementStats()

        # 步骤 A: 保护词锚点化
        text = self._isolate_protected_words(text)

        # 步骤 B & C: 优先级排序 + 正则边界匹配
        text = self._apply_corrections(text)

        # 步骤 D: 降噪与还原
        text = self._remove_noise(text)
        text = self._restore_protected_words(text)

        logger.info(f"处理完成，共替换 {self.stats.total_replacements} 次")

        return text, self.stats

    def _isolate_protected_words(self, text: str) -> str:
        """
        步骤 A: 保护词锚点化
        将保护词替换为唯一占位符

        Example:
            "Octane is great" -> "##_SHIELD_abc123_## is great"
        """
        logger.debug(f"开始保护 {len(self.protected_words)} 个词汇")

        for word in self.protected_words:
            # 生成唯一占位符
            placeholder = f"##_SHIELD_{uuid.uuid4().hex[:8]}_##"

            # 使用改进的边界匹配，支持英文与中文相邻的情况
            if self._is_english_word(word):
                pattern = rf'(?<![a-zA-Z0-9]){re.escape(word)}(?![a-zA-Z0-9])'
            else:
                pattern = re.escape(word)

            # 检查是否有匹配
            matches = re.findall(pattern, text, flags=re.IGNORECASE)
            if matches:
                # 保存映射关系（保留原始大小写）
                self.shield_map[placeholder] = matches[0]

                # 替换为占位符
                text = re.sub(pattern, placeholder, text, flags=re.IGNORECASE)

                logger.debug(f"保护词 '{word}' 已锚点化")

        return text

    def _apply_corrections(self, text: str) -> str:
        """
        步骤 B & C: 优先级排序 + 正则边界匹配
        按长词优先规则应用修正

        算法:
        1. 按 source 长度降序排序
        2. 使用正则边界符确保完整匹配
        3. 智能跳过双语标注（如"阈值(Threshold)"不会变成"阈值(阈值)"）
        """
        # 步骤 B: 按字符长度降序排序
        sorted_terms = sorted(
            self.correction_terms,
            key=lambda x: len(x.get('source', '')),
            reverse=True
        )

        logger.debug(f"开始应用 {len(sorted_terms)} 条修正规则（长词优先）")

        # 步骤 B-1: 保护双语标注模式
        # 例如 "阈值(Threshold)" 或 "阈值（Threshold）" 不应被替换为 "阈值(阈值)"
        bilingual_placeholders = {}
        for term in sorted_terms:
            source = term.get('source', '')
            target = term.get('target', '')

            if not source or not target:
                continue

            # 匹配双语标注模式: target + 括号 + source + 括号
            # 支持中英文括号: () 和 （）
            bilingual_pattern = rf'{re.escape(target)}[（(]{re.escape(source)}[)）]'
            matches = re.findall(bilingual_pattern, text)

            for match in matches:
                placeholder = f"##_BILINGUAL_{uuid.uuid4().hex[:8]}_##"
                bilingual_placeholders[placeholder] = match
                text = text.replace(match, placeholder, 1)
                logger.debug(f"保护双语标注: '{match}'")

        # 步骤 C: 应用修正规则
        for term in sorted_terms:
            source = term.get('source', '')
            target = term.get('target', '')

            if not source or not target:
                continue

            # 正则边界匹配
            # 判断是否为纯英文单词（需要单词边界）
            if self._is_english_word(source):
                # 使用改进的边界匹配，支持英文与中文相邻的情况
                # 匹配条件：source 前面不是英文字母数字，后面也不是英文字母数字
                # 这样 "Threshold设置" 中的 Threshold 也能被匹配
                pattern = rf'(?<![a-zA-Z0-9]){re.escape(source)}(?![a-zA-Z0-9])'
            else:
                # 中文或混合文本，不使用边界符
                pattern = re.escape(source)

            # 查找所有匹配
            matches = re.findall(pattern, text)
            if matches:
                count = len(matches)

                # 执行替换
                text = re.sub(pattern, target, text)

                # 更新统计
                self.stats.total_replacements += count
                self.stats.term_corrections += count
                self.stats.replacement_details.append({
                    'source': source,
                    'target': target,
                    'count': count,
                    'category': term.get('category', '术语映射')
                })

                logger.debug(f"'{source}' -> '{target}' (替换 {count} 次)")

        # 步骤 C-1: 还原双语标注
        for placeholder, original in bilingual_placeholders.items():
            text = text.replace(placeholder, original)
            logger.debug(f"还原双语标注: '{original}'")

        return text

    def _remove_noise(self, text: str) -> str:
        """
        步骤 D-1: 噪音清理
        使用正则表达式移除噪音标记

        Example:
            "Hello (音乐) World" -> "Hello  World"
        """
        logger.debug(f"开始清理 {len(self.noise_patterns)} 种噪音模式")

        for pattern_item in self.noise_patterns:
            # 支持两种格式: 字符串或字典
            if isinstance(pattern_item, dict):
                pattern = pattern_item.get('pattern', '')
            else:
                pattern = pattern_item

            if not pattern:
                continue

            # 查找匹配数量
            matches = re.findall(pattern, text)
            if matches:
                count = len(matches)

                # 移除噪音
                text = re.sub(pattern, '', text)

                # 更新统计
                self.stats.total_replacements += count
                self.stats.noise_removals += count

                logger.debug(
                    f"移除噪音模式 '{pattern}' ({count} 次)"
                )

        # 清理多余空行和空格
        text = re.sub(r'\n\s*\n', '\n\n', text)  # 多个空行合并为两个
        text = re.sub(r' {2,}', ' ', text)  # 多个空格合并为一个

        return text

    def _restore_protected_words(self, text: str) -> str:
        """
        步骤 D-2: 还原保护词
        将占位符还原为原始保护词
        """
        logger.debug(f"开始还原 {len(self.shield_map)} 个保护词")

        for placeholder, original_word in self.shield_map.items():
            text = text.replace(placeholder, original_word)
            logger.debug(f"还原: {placeholder} -> '{original_word}'")

        return text

    @staticmethod
    def _is_english_word(text: str) -> bool:
        """
        判断是否为纯英文单词

        Args:
            text: 待判断文本

        Returns:
            True 如果是纯英文单词
        """
        # 纯英文字母、数字、连字符
        return bool(re.match(r'^[a-zA-Z0-9\-]+$', text))


def create_engine_from_dicts(
    correction_dict: Dict[str, Any],
    shielding_dict: Dict[str, Any]
) -> SubtitleEngine:
    """
    从字典数据创建引擎实例

    Args:
        correction_dict: 修正规则字典
        shielding_dict: 保护词字典

    Returns:
        配置好的引擎实例
    """
    # 提取修正规则
    correction_terms = correction_dict.get('terms', [])

    # 提取保护词（支持两种格式）
    protected_words_data = shielding_dict.get('protected_words', [])
    if protected_words_data and isinstance(protected_words_data[0], dict):
        # 格式: [{"word": "...", "category": "..."}]
        protected_words = [item['word'] for item in protected_words_data]
    else:
        # 格式: ["word1", "word2", ...]
        protected_words = protected_words_data

    # 提取噪音模式
    noise_patterns = correction_dict.get('noise_patterns', [])

    return SubtitleEngine(
        correction_terms=correction_terms,
        protected_words=protected_words,
        noise_patterns=noise_patterns
    )
