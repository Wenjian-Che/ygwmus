from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent
FRAMES = ROOT / "frames"
CANVAS = (1920, 1080)
KEY = (0, 255, 0, 255)


def prepare(source_name: str, output_name: str) -> None:
    source = Image.open(FRAMES / source_name).convert("RGBA")
    target_height = 1030
    ratio = target_height / source.height
    resized = source.resize((round(source.width * ratio), target_height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", CANVAS, KEY)
    x = (CANVAS[0] - resized.width) // 2
    y = (CANVAS[1] - resized.height) // 2
    canvas.alpha_composite(resized, (x, y))
    canvas.convert("RGB").save(FRAMES / output_name, quality=98)


prepare("start-alpha.png", "01-first-frame-16x9.png")
prepare("end-alpha.png", "02-last-frame-16x9.png")
print("Prepared 1920x1080 first/last frames.")
