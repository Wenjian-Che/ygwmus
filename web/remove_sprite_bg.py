"""Remove the generated red backdrop from 4x2 mascot sprite sheets.

The flood fill starts at each frame edge, so similarly red costume details are
preserved unless they are connected to the outer background.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parent / "assets"
ACTIONS = ("idle", "beat", "cheer", "think", "explain", "surprised", "sleep")
FRAME_SIZE = 320
TOLERANCE = 34


def edge_background_mask(rgb: np.ndarray) -> np.ndarray:
    height, width, _ = rgb.shape
    patch = 22
    corners = np.concatenate(
        (
            rgb[:patch, :patch].reshape(-1, 3),
            rgb[:patch, -patch:].reshape(-1, 3),
            rgb[-patch:, :patch].reshape(-1, 3),
            rgb[-patch:, -patch:].reshape(-1, 3),
        )
    )
    background = np.median(corners, axis=0)
    distance = np.linalg.norm(rgb.astype(np.float32) - background, axis=2)
    candidate = Image.fromarray(((distance <= TOLERANCE) * 255).astype(np.uint8), "L").copy()
    ImageDraw.floodfill(candidate, (0, 0), 128, thresh=0)
    return np.asarray(candidate) == 128


for action in ACTIONS:
    source = Image.open(ROOT / f"pet-sprite-{action}.png").convert("RGB")
    source_width, source_height = source.size
    source_frame_width = source_width // 4
    source_frame_height = source_height // 2
    output = Image.new("RGBA", (FRAME_SIZE * 4, FRAME_SIZE * 2), (0, 0, 0, 0))
    for index in range(8):
        source_left = (index % 4) * source_frame_width
        source_top = (index // 4) * source_frame_height
        frame = source.crop(
            (
                source_left,
                source_top,
                source_left + source_frame_width,
                source_top + source_frame_height,
            )
        )
        frame.thumbnail((FRAME_SIZE, FRAME_SIZE), Image.Resampling.LANCZOS)
        rgb = np.asarray(frame)
        exterior = edge_background_mask(rgb)
        alpha = Image.fromarray((~exterior * 255).astype(np.uint8), "L")
        alpha = alpha.filter(ImageFilter.GaussianBlur(0.55))
        rgba = frame.convert("RGBA")
        rgba.putalpha(alpha)
        normalized = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE))
        normalized.alpha_composite(
            rgba, ((FRAME_SIZE - rgba.width) // 2, (FRAME_SIZE - rgba.height) // 2)
        )
        left = (index % 4) * FRAME_SIZE
        top = (index // 4) * FRAME_SIZE
        output.alpha_composite(normalized, (left, top))
    destination = ROOT / f"pet-sprite-{action}-alpha.webp"
    output.save(destination, "WEBP", quality=88, method=6, exact=True)
    print(f"{action}: {destination.name} ({destination.stat().st_size} bytes)")
