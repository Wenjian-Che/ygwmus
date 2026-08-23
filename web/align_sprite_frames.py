"""Register mascot sprite frames to a stable center and foot baseline."""

from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parent / "assets"
FRAME = 320

# Deliberate height and baseline changes preserve crouches and jumps while
# removing accidental camera zoom and horizontal drift from generated cels.
MOTION = {
    "idle": ([300] * 8, [315] * 8),
    "beat": ([295, 268, 278, 272, 266, 275, 280, 295], [315] * 8),
    "cheer": ([292, 252, 270, 282, 282, 278, 278, 292], [315, 315, 315, 310, 282, 302, 312, 315]),
    "think": ([300, 300, 300, 300, 296, 296, 296, 300], [315] * 8),
    "explain": ([300] * 8, [315] * 8),
    "surprised": ([300, 296, 296, 288, 280, 286, 292, 300], [315, 315, 315, 313, 284, 303, 313, 315]),
    "sleep": ([296] * 8, [315] * 8),
}
SOURCE_OVERRIDES = {
    "beat": {2: 1},
    "cheer": {3: 2, 4: 2},
    "surprised": {4: 3, 5: 3},
}


def registered_frame(frame: Image.Image, target_height: int, target_bottom: int) -> Image.Image:
    rgba = np.asarray(frame.convert("RGBA"))
    alpha = rgba[:, :, 3]
    ys, xs = np.where(alpha > 28)
    if not len(xs):
        return Image.new("RGBA", (FRAME, FRAME))
    left, top, right, bottom = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    subject = frame.crop((left, top, right, bottom))
    scale = target_height / max(1, subject.height)
    target_width = round(subject.width * scale)
    if target_width > 310:
        scale *= 310 / target_width
        target_width = 310
        target_height = round(subject.height * scale)
    subject = subject.resize((target_width, target_height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (FRAME, FRAME))
    x = round((FRAME - target_width) / 2)
    y = target_bottom - target_height
    canvas.alpha_composite(subject, (x, y))
    return canvas


for action, (heights, bottoms) in MOTION.items():
    source = Image.open(ROOT / f"pet-sprite-{action}-alpha.webp").convert("RGBA")
    sheet = Image.new("RGBA", source.size)
    for index in range(8):
        source_index = SOURCE_OVERRIDES.get(action, {}).get(index, index)
        left = (source_index % 4) * FRAME
        top = (source_index // 4) * FRAME
        frame = source.crop((left, top, left + FRAME, top + FRAME))
        aligned = registered_frame(frame, heights[index], bottoms[index])
        destination_left = (index % 4) * FRAME
        destination_top = (index // 4) * FRAME
        sheet.alpha_composite(aligned, (destination_left, destination_top))
    destination = ROOT / f"pet-sprite-{action}-aligned.webp"
    sheet.save(destination, "WEBP", quality=90, method=4, exact=True)
    print(f"{action}: {destination.name} ({destination.stat().st_size} bytes)")
