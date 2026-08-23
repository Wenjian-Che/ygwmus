#!/usr/bin/env python3
"""Build deterministic Markdown chunks and a small local retrieval baseline."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AGENT = ROOT / "agent"
HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$")
WIKILINK_RE = re.compile(r"\[\[([^\]|#]+)")
URL_RE = re.compile(r"https?://[^\s)>]+")
FRONT_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*\n", re.S)


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def parse_frontmatter(text: str) -> tuple[dict, str]:
    match = FRONT_RE.match(text)
    if not match:
        return {}, text
    meta = {}
    for line in match.group(1).splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        value = value.strip()
        if value.startswith("[") and value.endswith("]"):
            meta[key.strip()] = [x.strip() for x in value[1:-1].split(",") if x.strip()]
        else:
            meta[key.strip()] = value
    return meta, text[match.end():]


def sectionize(text: str) -> list[tuple[list[str], str]]:
    path: list[str] = []
    sections: list[tuple[list[str], list[str]]] = []
    current: list[str] = []
    current_path: list[str] = []
    fenced = False
    for line in text.splitlines():
        if line.lstrip().startswith("```"):
            fenced = not fenced
        match = None if fenced else HEADING_RE.match(line)
        if match:
            if any(x.strip() for x in current):
                sections.append((current_path, current))
            level = len(match.group(1))
            path = path[: level - 1] + [match.group(2).strip()]
            current_path = path.copy()
            current = []
        else:
            current.append(line)
    if any(x.strip() for x in current):
        sections.append((current_path, current))
    return [(p, "\n".join(lines).strip()) for p, lines in sections if "\n".join(lines).strip()]


def split_blocks(text: str) -> list[str]:
    blocks = []
    buf = []
    in_table = False
    for line in text.splitlines():
        is_table = line.lstrip().startswith("|")
        if not line.strip() and buf and not in_table:
            blocks.append("\n".join(buf).strip())
            buf = []
            continue
        if buf and in_table and not is_table:
            blocks.append("\n".join(buf).strip())
            buf = []
        buf.append(line)
        in_table = is_table
    if buf:
        blocks.append("\n".join(buf).strip())
    return [b for b in blocks if b]


def chunk_section(text: str, target: int, maximum: int, minimum: int, overlap: int) -> list[str]:
    blocks = split_blocks(text)
    chunks, current = [], ""
    for block in blocks:
        if len(block) > maximum:
            pieces = [block[i:i + maximum] for i in range(0, len(block), maximum - overlap)]
        else:
            pieces = [block]
        for piece in pieces:
            candidate = f"{current}\n\n{piece}".strip() if current else piece
            if current and len(candidate) > maximum:
                chunks.append(current)
                tail = current[-overlap:].lstrip() if overlap else ""
                current = f"{tail}\n\n{piece}".strip()
            else:
                current = candidate
            if len(current) >= target:
                chunks.append(current)
                current = current[-overlap:].lstrip() if overlap else ""
    if current:
        if chunks and len(current) < minimum:
            chunks[-1] = f"{chunks[-1]}\n\n{current}".strip()
        else:
            chunks.append(current)
    return [c for c in chunks if c.strip()]


def coalesce_small_fragments(fragments: list[dict], target: int, maximum: int, minimum: int) -> list[dict]:
    """Combine adjacent short sections so FAQ-style documents do not create tiny chunks."""
    merged = []
    pending = None
    for fragment in fragments:
        if pending is None:
            pending = fragment
            continue
        candidate = f"{pending['content']}\n\n{fragment['content']}".strip()
        if len(pending["content"]) < target and len(candidate) <= maximum:
            pending["content"] = candidate
            pending["heading_labels"].extend(fragment["heading_labels"])
        else:
            merged.append(pending)
            pending = fragment
    if pending is not None:
        if merged and len(pending["content"]) < minimum:
            candidate = f"{merged[-1]['content']}\n\n{pending['content']}".strip()
            if len(candidate) <= maximum:
                merged[-1]["content"] = candidate
                merged[-1]["heading_labels"].extend(pending["heading_labels"])
            else:
                merged.append(pending)
        else:
            merged.append(pending)
    return merged


def collection_map(manifest: dict) -> dict[str, str]:
    result = {}
    for collection in manifest["collections"]:
        for filename in collection["files"]:
            result[filename] = collection["id"]
    result[manifest["entry_file"]] = "entry"
    return result


def terms(text: str) -> list[str]:
    clean = re.sub(r"https?://\S+|[\W_]+", " ", text.lower())
    tokens = re.findall(r"[a-z0-9]+|[\u4e00-\u9fff]", clean)
    chinese = [x for x in tokens if "\u4e00" <= x <= "\u9fff"]
    words = [x for x in tokens if not ("\u4e00" <= x <= "\u9fff") and len(x) > 1]
    bigrams = [chinese[i] + chinese[i + 1] for i in range(len(chinese) - 1)]
    return words + chinese + bigrams


def build() -> list[dict]:
    manifest = load_json(AGENT / "knowledge_manifest.json")
    config = load_json(AGENT / "rag_config.json")
    cfg = config["chunking"]
    collections = collection_map(manifest)
    boosts = manifest.get("retrieval_boost", {})
    files = [manifest["entry_file"]]
    for group in manifest["collections"]:
        files.extend(group["files"])
    chunks = []
    for filename in dict.fromkeys(files):
        path = ROOT / filename
        meta, body = parse_frontmatter(path.read_text(encoding="utf-8-sig"))
        sections = sectionize(body)
        fragments = []
        for section_no, (heading_path, section_text) in enumerate(sections, 1):
            parts = chunk_section(
                section_text,
                cfg["target_chars"],
                cfg["max_chars"],
                cfg["min_chars"],
                cfg["overlap_chars"],
            )
            for part_no, content in enumerate(parts, 1):
                heading_label = " > ".join(heading_path)
                fragments.append({
                    "section_no": section_no,
                    "part_no": part_no,
                    "heading_path": heading_path,
                    "heading_labels": [heading_label] if heading_label else [],
                    "content": f"【{heading_label}】\n{content}" if heading_label else content,
                })
        fragments = coalesce_small_fragments(
            fragments, cfg["target_chars"], cfg["max_chars"], cfg["min_chars"]
        )
        for fragment_no, fragment in enumerate(fragments, 1):
                heading_path = fragment["heading_path"]
                content = fragment["content"]
                seed = f"{filename}|{fragment_no}|{content}"
                chunk_id = "yg-" + hashlib.sha1(seed.encode("utf-8")).hexdigest()[:12]
                chunks.append({
                    "id": chunk_id,
                    "source_file": filename,
                    "collection": collections.get(filename, "unknown"),
                    "title": heading_path[0] if heading_path else path.stem,
                    "heading_path": heading_path,
                    "included_headings": fragment["heading_labels"],
                    "content": content,
                    "char_count": len(content),
                    "tags": meta.get("tags", []),
                    "aliases": meta.get("aliases", []),
                    "status": meta.get("status", ""),
                    "updated": meta.get("updated", ""),
                    "wikilinks": sorted(set(WIKILINK_RE.findall(content))),
                    "urls": URL_RE.findall(content),
                    "retrieval_boost": boosts.get(filename, 1.0),
                })
    out = AGENT / "generated"
    out.mkdir(exist_ok=True)
    with (out / "chunks.jsonl").open("w", encoding="utf-8", newline="\n") as f:
        for chunk in chunks:
            f.write(json.dumps(chunk, ensure_ascii=False, separators=(",", ":")) + "\n")
    df = Counter()
    postings = defaultdict(list)
    for chunk in chunks:
        counts = Counter(terms(" ".join(chunk["heading_path"]) + " " + chunk["content"]))
        for term, count in counts.items():
            df[term] += 1
            postings[term].append([chunk["id"], count])
    index = {
        "version": manifest["knowledge_version"],
        "chunk_count": len(chunks),
        "document_frequency": dict(df),
        "postings": dict(postings),
    }
    (out / "lexical_index.json").write_text(
        json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    stats = {
        "knowledge_version": manifest["knowledge_version"],
        "files": len(set(c["source_file"] for c in chunks)),
        "chunks": len(chunks),
        "characters": sum(c["char_count"] for c in chunks),
        "min_chunk_chars": min(c["char_count"] for c in chunks),
        "max_chunk_chars": max(c["char_count"] for c in chunks),
        "average_chunk_chars": round(sum(c["char_count"] for c in chunks) / len(chunks), 1),
        "chunks_with_urls": sum(bool(c["urls"]) for c in chunks),
        "chunks_with_wikilinks": sum(bool(c["wikilinks"]) for c in chunks),
    }
    (out / "build_report.json").write_text(
        json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    web_data = ROOT / "web" / "data"
    web_data.mkdir(parents=True, exist_ok=True)
    for filename in ("chunks.jsonl", "lexical_index.json", "build_report.json"):
        shutil.copy2(out / filename, web_data / filename)
    print(json.dumps(stats, ensure_ascii=False, indent=2))
    return chunks


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--build", action="store_true", help="build generated retrieval artifacts")
    args = parser.parse_args()
    if args.build or not any(vars(args).values()):
        build()


if __name__ == "__main__":
    main()
