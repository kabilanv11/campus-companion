# Draws the app icon: the teal page with the "right now" island and the next-meal card under it.
# Maskable-safe: all marks sit inside the central 80% circle.
from PIL import Image, ImageDraw
import sys

def icon(size, path, maskable=True):
    s = size * 4  # supersample
    img = Image.new("RGB", (s, s), "#0c4243")
    d = ImageDraw.Draw(img)
    u = s / 100
    d.rounded_rectangle([26*u, 30*u, 74*u, 50*u], radius=5*u, fill="#ffffff")
    d.rounded_rectangle([30*u, 54*u, 70*u, 70*u], radius=5*u, fill="#7fd4d0")
    img.resize((size, size), Image.LANCZOS).save(path)

out = sys.argv[1]
icon(192, f"{out}/icon-192.png")
icon(512, f"{out}/icon-512.png")
icon(180, f"{out}/apple-touch-icon.png")
icon(64, f"{out}/favicon-64.png")
