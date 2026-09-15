#!/usr/bin/env python3
"""Regression checks for the formal knowledge package and generated index."""

import json
import os
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
KB = Path(os.environ["KNOWLEDGE_SOURCE_DIR"]).resolve()
MANIFEST = json.loads((ROOT / "agent" / "knowledge_manifest.json").read_text(encoding="utf-8-sig"))

disk_files = {path.name for path in KB.glob("*.md")}
manifest_files = {MANIFEST["entry_file"]}
for collection in MANIFEST["collections"]:
    manifest_files.update(collection["files"])

assert disk_files == manifest_files, (
    f"正式知识库与清单不一致；磁盘独有={sorted(disk_files-manifest_files)}，"
    f"清单独有={sorted(manifest_files-disk_files)}"
)
assert len(disk_files) == 94, f"正式知识库应统一统计为 94 份 Markdown，实际 {len(disk_files)}"
print("formal KB coverage tests passed")
