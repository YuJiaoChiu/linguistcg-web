"""
SRT 字幕文件解析器
支持标准 SRT 格式的解析和生成
"""

import re
import logging
from typing import List, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class SubtitleEntry:
    """字幕条目"""
    index: int
    start_time: str
    end_time: str
    text: str
    original_text: Optional[str] = None  # 保存原始文本用于对比

    def to_srt_format(self) -> str:
        """转换为 SRT 格式字符串"""
        return f"{self.index}\n{self.start_time} --> {self.end_time}\n{self.text}\n"


class SRTParser:
    """SRT 文件解析器"""

    # SRT 时间码格式: 00:00:00,000
    TIME_PATTERN = re.compile(
        r'(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})'
    )

    @classmethod
    def parse(cls, content: str) -> List[SubtitleEntry]:
        """
        解析 SRT 文件内容

        Args:
            content: SRT 文件文本内容

        Returns:
            字幕条目列表

        Example:
            >>> content = '''
            ... 1
            ... 00:00:01,000 --> 00:00:03,000
            ... Hello World
            ...
            ... 2
            ... 00:00:04,000 --> 00:00:06,000
            ... This is a test
            ... '''
            >>> entries = SRTParser.parse(content)
            >>> len(entries)
            2
        """
        entries: List[SubtitleEntry] = []

        # 按空行分割字幕块
        blocks = re.split(r'\n\s*\n', content.strip())

        for block in blocks:
            if not block.strip():
                continue

            lines = block.strip().split('\n')
            if len(lines) < 3:
                logger.warning(f"无效的字幕块: {block[:50]}...")
                continue

            try:
                # 第一行: 序号
                index = int(lines[0].strip())

                # 第二行: 时间码
                time_match = cls.TIME_PATTERN.search(lines[1])
                if not time_match:
                    logger.warning(f"无法解析时间码: {lines[1]}")
                    continue

                start_time = time_match.group(1)
                end_time = time_match.group(2)

                # 第三行及之后: 字幕文本
                text = '\n'.join(lines[2:])

                entry = SubtitleEntry(
                    index=index,
                    start_time=start_time,
                    end_time=end_time,
                    text=text,
                    original_text=text  # 保存原始文本
                )

                entries.append(entry)

            except (ValueError, IndexError) as e:
                logger.error(f"解析字幕块失败: {e}, 内容: {block[:50]}...")
                continue

        logger.info(f"成功解析 {len(entries)} 条字幕")
        return entries

    @classmethod
    def generate(cls, entries: List[SubtitleEntry]) -> str:
        """
        生成 SRT 文件内容

        Args:
            entries: 字幕条目列表

        Returns:
            SRT 格式的文本内容
        """
        srt_blocks = []

        for entry in entries:
            srt_blocks.append(entry.to_srt_format())

        return '\n'.join(srt_blocks)

    @classmethod
    def validate(cls, content: str) -> bool:
        """
        验证 SRT 文件格式是否正确

        Args:
            content: SRT 文件内容

        Returns:
            True 如果格式正确
        """
        try:
            entries = cls.parse(content)
            return len(entries) > 0
        except Exception as e:
            logger.error(f"SRT 验证失败: {e}")
            return False


class SRTProcessor:
    """SRT 字幕处理器"""

    def __init__(self, content: str):
        """
        初始化处理器

        Args:
            content: 原始 SRT 文件内容
        """
        self.original_content = content
        self.entries = SRTParser.parse(content)
        self.processed = False

    def apply_text_transform(self, transform_func):
        """
        对所有字幕文本应用转换函数

        Args:
            transform_func: 接受文本并返回转换后文本的函数
        """
        for entry in self.entries:
            # 保存原始文本（如果还没保存）
            if entry.original_text is None:
                entry.original_text = entry.text

            # 应用转换
            entry.text = transform_func(entry.text)

        self.processed = True

    def get_modified_content(self) -> str:
        """
        获取修改后的 SRT 内容

        Returns:
            处理后的 SRT 文本
        """
        return SRTParser.generate(self.entries)

    def get_diff_data(self) -> List[dict]:
        """
        获取修改前后的差异数据

        Returns:
            包含原始和修改后文本的列表
        """
        diff_data = []

        for entry in self.entries:
            diff_data.append({
                'index': entry.index,
                'time': f"{entry.start_time} --> {entry.end_time}",
                'original': entry.original_text or entry.text,
                'modified': entry.text,
                'changed': entry.original_text != entry.text
            })

        return diff_data

    def get_statistics(self) -> dict:
        """
        获取处理统计信息

        Returns:
            统计数据字典
        """
        total = len(self.entries)
        changed = sum(
            1 for e in self.entries
            if e.original_text and e.original_text != e.text
        )

        return {
            'total_entries': total,
            'modified_entries': changed,
            'unchanged_entries': total - changed,
            'modification_rate': round(changed / total * 100, 2) if total > 0 else 0
        }
