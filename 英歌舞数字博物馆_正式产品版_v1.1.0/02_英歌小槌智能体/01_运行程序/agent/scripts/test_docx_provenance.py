import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MODULE = Path(__file__).with_name("extract_docx_provenance.py")
SOURCE_ROOT = Path(r"D:\vctest\英歌舞")


def load_module():
    spec = importlib.util.spec_from_file_location("extract_docx_provenance", MODULE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class ProvenanceExtractionTest(unittest.TestCase):
    def test_actual_documents_keep_paragraph_links_and_image_relationship_status(self):
        module = load_module()
        documents = [
            SOURCE_ROOT / "2025年郑一见个人经历和荣誉佐证材料.docx",
            SOURCE_ROOT / "郑一见 佐证材料-202502之前部分.docx",
        ]
        result = [module.extract_document(document) for document in documents]

        self.assertTrue(all(item["paragraphs"] for item in result))
        self.assertTrue(any("mfa.gov.cn" in link["url"] for item in result for link in item["links"]))
        self.assertTrue(any(image["relationship_status"] == "resolved" for item in result for image in item["images"]))
        self.assertTrue(all(image["relationship_status"] in {"resolved", "missing"} for item in result for image in item["images"]))
        self.assertTrue(all("missing_image_count" in item["summary"] for item in result))
        self.assertTrue(all("paragraph_index" in image for item in result for image in item["images"]))


if __name__ == "__main__":
    unittest.main()
