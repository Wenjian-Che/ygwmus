"""Read-only DOCX provenance extractor.

It preserves paragraph order, external links and image relationship status. Missing
relationships are reported instead of being guessed from media filenames.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "v": "urn:schemas-microsoft-com:vml",
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
    "pr": "http://schemas.openxmlformats.org/package/2006/relationships",
}
REL_ID = f"{{{NS['r']}}}id"
REL_EMBED = f"{{{NS['r']}}}embed"
REL_LINK = f"{{{NS['r']}}}link"
URL_RE = re.compile(r"https?://[^\s<>\]\[）)]+")


def _relations(archive: zipfile.ZipFile) -> dict[str, dict[str, str]]:
    root = ET.fromstring(archive.read("word/_rels/document.xml.rels"))
    return {
        item.attrib["Id"]: {
            "target": item.attrib.get("Target", ""),
            "type": item.attrib.get("Type", ""),
            "target_mode": item.attrib.get("TargetMode", ""),
        }
        for item in root.findall("pr:Relationship", NS)
    }


def _paragraph_text(paragraph: ET.Element) -> str:
    return "".join(node.text or "" for node in paragraph.findall(".//w:t", NS)).strip()


def _paragraph_links(paragraph: ET.Element, relationships: dict[str, dict[str, str]]) -> list[dict[str, str]]:
    found: list[dict[str, str]] = []
    for hyperlink in paragraph.findall(".//w:hyperlink", NS):
        rel_id = hyperlink.attrib.get(REL_ID, "")
        rel = relationships.get(rel_id)
        label = "".join(node.text or "" for node in hyperlink.findall(".//w:t", NS)).strip()
        found.append({
            "relationship_id": rel_id,
            "label": label,
            "url": rel["target"] if rel else "",
            "relationship_status": "resolved" if rel else "missing",
        })
    text = _paragraph_text(paragraph)
    existing = {item["url"] for item in found if item["url"]}
    for match in URL_RE.findall(text):
        if match not in existing:
            found.append({"relationship_id": "", "label": match, "url": match, "relationship_status": "inline"})
    return found


def _paragraph_images(paragraph: ET.Element, relationships: dict[str, dict[str, str]], paragraph_index: int) -> list[dict[str, object]]:
    images: list[dict[str, object]] = []
    descriptions = [
        {
            "name": node.attrib.get("name", ""),
            "description": node.attrib.get("descr", ""),
            "title": node.attrib.get("title", ""),
        }
        for node in paragraph.findall(".//wp:docPr", NS)
    ]
    references: list[tuple[str, str]] = []
    for node in paragraph.findall(".//a:blip", NS):
        rel_id = node.attrib.get(REL_EMBED) or node.attrib.get(REL_LINK) or ""
        references.append((rel_id, "drawingml"))
    for node in paragraph.findall(".//v:imagedata", NS):
        references.append((node.attrib.get(REL_ID, ""), "vml"))
    for order, (rel_id, kind) in enumerate(references):
        rel = relationships.get(rel_id)
        target = rel["target"] if rel else ""
        images.append({
            "paragraph_index": paragraph_index,
            "relationship_id": rel_id,
            "relationship_status": "resolved" if rel else "missing",
            "relationship_type": kind,
            "media_target": target,
            "media_file": Path(target).name if target else "",
            "drawing_metadata": descriptions[order] if order < len(descriptions) else {},
        })
    return images


def extract_document(document: str | Path) -> dict[str, object]:
    source = Path(document)
    with zipfile.ZipFile(source) as archive:
        relationships = _relations(archive)
        root = ET.fromstring(archive.read("word/document.xml"))
        paragraphs: list[dict[str, object]] = []
        links: list[dict[str, object]] = []
        images: list[dict[str, object]] = []
        for index, paragraph in enumerate(root.findall(".//w:body/w:p", NS), start=1):
            text = _paragraph_text(paragraph)
            paragraph_links = _paragraph_links(paragraph, relationships)
            paragraph_images = _paragraph_images(paragraph, relationships, index)
            paragraphs.append({
                "paragraph_index": index,
                "text": text,
                "link_count": len(paragraph_links),
                "image_count": len(paragraph_images),
            })
            links.extend({**item, "paragraph_index": index, "paragraph_text": text} for item in paragraph_links)
            images.extend({**item, "paragraph_text": text} for item in paragraph_images)
        archive_media = []
        for name in archive.namelist():
            if not name.startswith("word/media/") or name.endswith("/"):
                continue
            content = archive.read(name)
            archive_media.append({
                "archive_path": name,
                "media_file": Path(name).name,
                "size_bytes": len(content),
                "sha256": hashlib.sha256(content).hexdigest(),
            })
    return {
        "source_document": str(source),
        "paragraphs": paragraphs,
        "links": links,
        "images": images,
        "archive_media": archive_media,
        "summary": {
            "paragraph_count": len(paragraphs),
            "link_count": len(links),
            "image_reference_count": len(images),
            "resolved_image_count": sum(item["relationship_status"] == "resolved" for item in images),
            "missing_image_count": sum(item["relationship_status"] == "missing" for item in images),
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("documents", nargs="+")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    payload = {
        "schema_version": 1,
        "documents": [extract_document(document) for document in args.documents],
        "provenance_rule": "Missing relationships remain unresolved and are never inferred from file order.",
    }
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
