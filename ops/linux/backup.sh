#!/usr/bin/env bash
set -euo pipefail

project_dir="/opt/yingge"
backup_root="/var/backups/yingge"
timestamp="$(date +%Y%m%d-%H%M%S)"
target="${backup_root}/${timestamp}"

install -d -m 0750 -o yingge -g yingge "$target"

if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "${project_dir}/backend/yingge.sqlite" ".backup '${target}/yingge.sqlite'"
else
  cp -a "${project_dir}/backend/yingge.sqlite" "${target}/yingge.sqlite"
fi

cp -a "${project_dir}/backend/apps.json" "$target/"
cp -a "${project_dir}/agent/knowledge_manifest.json" "$target/"
cp -a "${project_dir}/web/data/source_registry.json" "$target/"
cp -a "${project_dir}/automation/dynamic.jsonl" "$target/" 2>/dev/null || true

find "$backup_root" -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf -- {} +
