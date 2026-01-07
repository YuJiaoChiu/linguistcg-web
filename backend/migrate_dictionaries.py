"""
字典格式迁移脚本
将旧的简单键值对格式转换为新的结构化格式
"""

import json
import sys
from pathlib import Path

def migrate_correction_dict(input_file: Path, output_file: Path):
    """迁移修正字典"""
    print(f"正在读取旧格式字典: {input_file}")

    with open(input_file, 'r', encoding='utf-8') as f:
        old_dict = json.load(f)

    # 转换为新格式
    new_dict = {
        "terms": [],
        "noise_patterns": []
    }

    # 将键值对转换为术语列表
    for source, target in old_dict.items():
        term = {
            "source": source,
            "target": target,
            "category": "术语映射" if target else "噪音清理"
        }
        new_dict["terms"].append(term)

        # 如果target为空，说明是噪音模式
        if not target:
            # 转义特殊字符，创建正则表达式
            escaped = source.replace('(', r'\(').replace(')', r'\)')
            new_dict["noise_patterns"].append(escaped)

    print(f"转换完成: {len(new_dict['terms'])} 个术语, {len(new_dict['noise_patterns'])} 个噪音模式")

    # 备份旧文件
    backup_file = input_file.with_suffix('.json.backup')
    print(f"备份旧文件到: {backup_file}")
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(old_dict, f, ensure_ascii=False, indent=2)

    # 写入新格式
    print(f"写入新格式到: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(new_dict, f, ensure_ascii=False, indent=2)

    print("✅ 迁移完成！")

def migrate_shielding_dict(input_file: Path, output_file: Path):
    """迁移保护词字典"""
    print(f"正在读取保护词字典: {input_file}")

    with open(input_file, 'r', encoding='utf-8') as f:
        old_dict = json.load(f)

    # 检查是否已经是新格式
    if "protected_words" in old_dict and isinstance(old_dict["protected_words"], list):
        print("保护词字典已经是新格式，无需迁移")
        return

    # 转换为新格式
    new_dict = {
        "protected_words": list(old_dict.keys())
    }

    print(f"转换完成: {len(new_dict['protected_words'])} 个保护词")

    # 备份旧文件
    backup_file = input_file.with_suffix('.json.backup')
    print(f"备份旧文件到: {backup_file}")
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(old_dict, f, ensure_ascii=False, indent=2)

    # 写入新格式
    print(f"写入新格式到: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(new_dict, f, ensure_ascii=False, indent=2)

    print("✅ 迁移完成！")

if __name__ == "__main__":
    # 获取项目根目录
    root_dir = Path(__file__).parent.parent
    dict_dir = root_dir / "dictionaries"

    print("=" * 60)
    print("LinguistCG 字典格式迁移工具")
    print("=" * 60)
    print()

    # 迁移修正字典
    correction_input = dict_dir / "Correction.json"
    correction_output = dict_dir / "Correction.json"

    if correction_input.exists():
        migrate_correction_dict(correction_input, correction_output)
    else:
        print(f"❌ 未找到文件: {correction_input}")

    print()

    # 迁移保护词字典
    shielding_input = dict_dir / "shielding.json"
    shielding_output = dict_dir / "shielding.json"

    if shielding_input.exists():
        migrate_shielding_dict(shielding_input, shielding_output)
    else:
        print(f"❌ 未找到文件: {shielding_input}")

    print()
    print("=" * 60)
    print("迁移完成！旧文件已备份为 .json.backup")
    print("=" * 60)
