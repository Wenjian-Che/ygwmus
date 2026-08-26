#!/usr/bin/env python3
"""Build a deterministic evidence map for all FAQ items."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AGENT = ROOT / "agent"

TOPIC_RULES = [
    (["照片", "图片", "视频", "海报", "老照片"], ["54_多模态识别与问答边界.md", "38_脸谱服饰视觉辨识指南.md"]),
    (["正式名称", "同一个", "中华战舞", "鹰歌", "鹦哥"], ["24_术语表与概念辨析.md"]),
    (["起源", "历史", "唐宋", "明代", "最早出现", "水浒", "三百年"], ["01_历史渊源.md", "40_历史年表与证据分层.md", "30_常见争议与事实辨析.md"]),
    (["国家级非遗", "项目编号", "Ⅲ—8", "保护普宁", "保护潮阳", "传承人", "陈来发", "联合国", "什么级别"], ["08_非遗保护.md", "41_传承人与保护单位档案.md", "50_核心事实注册表.md"]),
    (["108", "多少人"], ["03_表演形式.md", "50_核心事实注册表.md"]),
    (["前棚", "后棚"], ["23_演出结构详解.md"]),
    (["快板", "中板", "慢板", "板式", "醉槌"], ["14_快板中板慢板详解.md", "53_地区板式队伍比较矩阵.md"]),
    (["潮南", "惠来", "甲子", "神泉", "文光", "忠精", "华市", "联兴", "泥沟", "西岐", "南溪", "普宁", "潮阳", "哪个村", "每个城市"], ["53_地区板式队伍比较矩阵.md", "35_代表队伍档案.md", "37_潮南惠来及周边地区档案.md"]),
    (["头槌", "二槌", "时迁", "宋江", "角色"], ["52_角色功能与辨识关系表.md", "16_核心角色详解.md"]),
    (["脸谱", "红脸", "黑脸", "面具"], ["38_脸谱服饰视觉辨识指南.md", "54_多模态识别与问答边界.md"]),
    (["旋槌", "洗街", "布田", "抱槌", "穿双龙", "猛虎下山", "队形", "阵形", "阵法", "动作"], ["36_动作与步法词典.md", "15_阵法与队形详解.md"]),
    (["木棒", "英歌槌", "尺寸"], ["19_英歌槌制作工艺详解.md", "05_道具与服饰.md"]),
    (["服饰", "草鞋", "铃铛"], ["05_道具与服饰.md", "38_脸谱服饰视觉辨识指南.md"]),
    (["锣鼓", "声音", "吆喝", "唢呐", "曲牌", "乐器", "分轨"], ["39_锣鼓节奏与声音档案.md", "22_锣鼓乐器与曲牌详解.md"]),
    (["女子", "西门女子"], ["12_女子英歌.md", "35_代表队伍档案.md"]),
    (["儿童", "自学", "训练", "安全", "评价顺序"], ["26_训练体系与安全规范.md", "28_校园课程与公众教育.md"]),
    (["春节", "游神", "点睛", "街巷", "巡游", "观众"], ["43_仪式流程与巡游空间.md", "55_实时活动问答与数据接口规范.md"]),
    (["海外", "纽约"], ["45_侨乡网络与海外传播类型.md"]),
    (["采访", "研究", "来源冲突", "短视频", "播放量"], ["27_田野调查方法与访谈提纲.md", "30_常见争议与事实辨析.md", "31_权威来源与参考书目.md"]),
]

FACT_BY_ID = {
    "faq-001":["F001"], "faq-003":["F010"], "faq-004":["F011"], "faq-006":["F022"],
    "faq-008":["F005","F006"], "faq-009":["F007"], "faq-010":["F008","F038","F039","F040"],
    "faq-011":["F024"], "faq-013":["F002","F003"], "faq-015":["F012"],
    "faq-016":["F018"], "faq-020":["F008"], "faq-021":["F024"],
    "faq-022":["F018","F026"], "faq-023":["F027"], "faq-024":["F028"],
    "faq-028":["F041"], "faq-029":["F034"], "faq-030":["F023"], "faq-031":["F023"],
    "faq-034":["F022","F043"], "faq-035":["F007"], "faq-037":["F013"],
    "faq-039":["F025"], "faq-041":["F001"], "faq-042":["F001"], "faq-044":["F010"],
    "faq-048":["F011"], "faq-049":["F003"], "faq-050":["F002"], "faq-051":["F016"],
    "faq-052":["F019"], "faq-054":["F015"], "faq-055":["F015"], "faq-056":["F013"],
    "faq-057":["F014"], "faq-058":["F020"], "faq-061":["F028"], "faq-062":["F029"],
    "faq-063":["F031"], "faq-064":["F030"], "faq-065":["F032"], "faq-066":["F050"],
    "faq-068":["F024"], "faq-074":["F041"], "faq-075":["F041"], "faq-079":["F044"],
    "faq-082":["F037"], "faq-083":["F037"], "faq-084":["F022"],
    "faq-085":["F022","F043"], "faq-086":["F043"], "faq-087":["F023","F033","F034"],
    "faq-088":["F023","F034"], "faq-089":["F033"], "faq-091":["F025"],
    "faq-092":["F045"], "faq-093":["F045"], "faq-097":["F021"], "faq-098":["F022"],
}


def main() -> None:
    faq = json.loads((AGENT / "faq_100.json").read_text(encoding="utf-8-sig"))
    items = []
    for item in faq["items"]:
        text = item["question"]
        source_files = []
        for keywords, files in TOPIC_RULES:
            if any(keyword in text for keyword in keywords):
                source_files.extend(files)
                break
        source_files.append(item["source_file"])
        items.append({
            "faq_id": item["id"],
            "question": item["question"],
            "source_files": list(dict.fromkeys(source_files)),
            "fact_ids": FACT_BY_ID.get(item["id"], []),
            "evidence_mode": "realtime" if any(x in text for x in ["活动时间", "今天", "明天", "票务"]) else "static",
            "citation_required": any(x in text for x in ["起源", "历史", "非遗", "传承人", "成立", "级别", "播放量", "海外"]),
        })
    output = {
        "version": "2026.07.28.3",
        "count": len(items),
        "description": "FAQ到知识页、事实卡和证据模式的映射；source_files按具体知识页优先、问答集兜底。",
        "items": items,
    }
    (AGENT / "faq_evidence.json").write_text(
        json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps({"count": len(items), "with_fact_ids": sum(bool(x["fact_ids"]) for x in items)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
