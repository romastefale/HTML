#!/usr/bin/env python3
"""Writes the two static page backgrounds (src/assets/fundo-{claro,escuro}.svg).

Irregular, heavily blurred colour fields (never circles) over a vertical base
that starts and ends on --page-edge (the browser-bar colour of the mode). A
vertical mask keeps the fields out of the top and bottom 14%, so both edges
are the exact solid colour. Deterministic (fixed seed): rerun only to change
the design, then commit the SVGs. docs/DESIGN-CONTRATO.md D1–D2.
"""
import math, random, pathlib

W, H = 1000, 1600
OUT = pathlib.Path(__file__).resolve().parent.parent / "src" / "assets"

def blob(rng, cx, cy, rx, ry, rot, n=7, jitter=.38):
    """Closed Catmull-Rom curve through n points at irregular radii and angles."""
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n + rng.uniform(-.35, .35)
        r = 1 + rng.uniform(-jitter, jitter)
        x, y = math.cos(a) * rx * r, math.sin(a) * ry * r
        c, s = math.cos(rot), math.sin(rot)
        pts.append((cx + x * c - y * s, cy + x * s + y * c))
    d = f"M{pts[0][0]:.0f} {pts[0][1]:.0f}"
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f"C{c1[0]:.0f} {c1[1]:.0f} {c2[0]:.0f} {c2[1]:.0f} {p2[0]:.0f} {p2[1]:.0f}"
    return d + "Z"

# (centre x, centre y, radius x, radius y, rotation) in the 1000×1600 box.
FIELDS = [
    (170, 470, 330, 170, -.5),
    (840, 560, 300, 210, .6),
    (360, 820, 420, 150, .25),
    (760, 1010, 280, 190, -.8),
    (230, 1130, 300, 160, .9),
    (600, 640, 190, 250, 1.2),
    (880, 1230, 240, 130, .3),
]

THEMES = {
    "claro": {
        "base": [(0, "#8b82e6"), (.12, "#c4bbf6"), (.28, "#f2ebfb"), (.5, "#eef2ff"), (.72, "#fbecf3"), (.88, "#c4bbf6"), (1, "#8b82e6")],
        "fields": [("#ff9ecd", .70), ("#7fcfff", .68), ("#ffd49a", .66), ("#8ef0d2", .60), ("#c9a6ff", .62), ("#ffb8a8", .50), ("#a9c8ff", .55)],
    },
    "escuro": {
        "base": [(0, "#1b1646"), (.12, "#281f6a"), (.28, "#1d2a60"), (.5, "#16304d"), (.72, "#2b1e58"), (.88, "#281f6a"), (1, "#1b1646")],
        "fields": [("#d646a0", .42), ("#28a0dc", .40), ("#e68c3c", .28), ("#28c8aa", .30), ("#7850e6", .40), ("#c8508c", .26), ("#3c78dc", .32)],
    },
}

for name, t in THEMES.items():
    rng = random.Random(14)
    stops = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in t["base"])
    paths = "".join(
        f'<path d="{blob(rng, *f)}" fill="{c}" fill-opacity="{a}"/>'
        for f, (c, a) in zip(FIELDS, t["fields"])
    )
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="none">'
        f'<defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1">{stops}</linearGradient>'
        '<linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset=".14" stop-color="#fff" stop-opacity="0"/>'
        '<stop offset=".3" stop-color="#fff"/><stop offset=".7" stop-color="#fff"/><stop offset=".86" stop-color="#fff" stop-opacity="0"/></linearGradient>'
        f'<mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}"><rect width="{W}" height="{H}" fill="url(#v)"/></mask>'
        '<filter id="f" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="70"/></filter></defs>'
        f'<rect width="{W}" height="{H}" fill="url(#b)"/>'
        f'<g mask="url(#m)"><g filter="url(#f)">{paths}</g></g></svg>\n'
    )
    (OUT / f"fundo-{name}.svg").write_text(svg)
    print(name, len(svg), "bytes")
