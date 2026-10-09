"""Optional asset regeneration: Python 3 + Pillow; no web/font inputs."""
from pathlib import Path
from PIL import Image, ImageDraw

SCALE = 3
image = Image.new("RGB", (1024 * SCALE, 1024 * SCALE), "#20394b")
draw = ImageDraw.Draw(image)

def box(points):
    return tuple(round(value * SCALE) for value in points)

def line(points, color, width):
    coords = [(round(x * SCALE), round(y * SCALE)) for x, y in points]
    draw.line(coords, fill=color, width=round(width * SCALE), joint="curve")
    for x, y in (points[0], points[-1]):
        radius = width / 2
        draw.ellipse(box((x-radius, y-radius, x+radius, y+radius)), fill=color)

# An immutable artifact and a distinct attached decision, without text.
draw.rounded_rectangle(box((222, 174, 736, 812)), radius=38*SCALE, fill="#f7f4ed")
draw.polygon([box((624, 174)), box((736, 174)), box((736, 286))], fill="#20394b")
draw.polygon([box((624, 174)), box((624, 286)), box((736, 286))], fill="#cbd8e2")
line([(302, 358), (614, 358)], "#a9bac6", 24)
line([(302, 438), (614, 438)], "#a9bac6", 24)
line([(302, 518), (528, 518)], "#a9bac6", 24)

draw.ellipse(box((538, 538, 862, 862)), fill="#20394b")
draw.ellipse(box((554, 554, 846, 846)), fill="#5eb8c8")
line([(628, 704), (685, 758), (777, 648)], "#20394b", 32)

destination = Path("public/agentproof-logo.png")
destination.parent.mkdir(exist_ok=True)
image.resize((1024, 1024), Image.Resampling.LANCZOS).save(destination, optimize=True)
print(f"{destination}: 1024 x 1024, {destination.stat().st_size} bytes")
