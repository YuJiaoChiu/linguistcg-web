"""
测试脚本 - 验证核心引擎功能
"""

import json
from pathlib import Path
from app.core.processor import SubtitleProcessor


def test_engine():
    """测试字幕处理引擎"""

    # 示例 SRT 内容
    test_srt = """1
00:00:01,000 --> 00:00:03,500
Welcome to this tutorial about Octane renderer

2
00:00:04,000 --> 00:00:07,000
Today we will learn about Keyframe animation

3
00:00:07,500 --> 00:00:10,000
First, let's set up the Effective Path

4
00:00:10,500 --> 00:00:13,000
Then we'll adjust the F曲线 for smooth motion (音乐)

5
00:00:13,500 --> 00:00:16,000
The Render Engine in Maya is very powerful
"""

    print("=" * 60)
    print("LinguistCG 引擎测试")
    print("=" * 60)

    # 创建处理器
    print("\n📚 加载字典...")
    processor = SubtitleProcessor()

    # 处理字幕
    print("\n🔄 开始处理字幕...")
    modified_content, report = processor.process_file(test_srt)

    # 输出结果
    print("\n" + "=" * 60)
    print("处理结果")
    print("=" * 60)

    print("\n📊 统计信息:")
    print(f"  总替换次数: {report['replacement_stats']['total_replacements']}")
    print(f"  术语修正: {report['replacement_stats']['term_corrections']}")
    print(f"  噪音清理: {report['replacement_stats']['noise_removals']}")

    print(f"\n  字幕总数: {report['srt_stats']['total_entries']}")
    print(f"  修改条数: {report['srt_stats']['modified_entries']}")
    print(f"  修改比例: {report['srt_stats']['modification_rate']}%")

    if report['replacement_stats']['top_replacements']:
        print("\n🔝 Top 替换:")
        for item in report['replacement_stats']['top_replacements'][:5]:
            print(f"  '{item['source']}' → '{item['target']}' ({item['count']} 次)")

    print("\n" + "=" * 60)
    print("处理后的字幕内容")
    print("=" * 60)
    print(modified_content)

    print("\n✅ 测试完成!")


if __name__ == "__main__":
    test_engine()
