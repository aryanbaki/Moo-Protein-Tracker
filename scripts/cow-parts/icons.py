"""
App icon and splash from the cow artwork.

  python3 icons.py     (after build.py)

Outputs ../../assets/icon.png (1024 x 1024, opaque) and ../../assets/splash-icon.png (1024 x 1024, transparent).
"""
import os

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', '..', 'assets')
FONT = os.path.join(HERE, '..', '..', 'node_modules', '@expo-google-fonts', 'nunito', '900Black', 'Nunito_900Black.ttf')
CREAM = (255, 243, 214)
INK = (33, 38, 31)

whole = cv2.cvtColor(np.array(Image.open(os.path.join(ASSETS, 'cow', 'whole.webp')).convert('RGBA')), cv2.COLOR_RGBA2BGRA)
# whole.png is cropped; put it back on the 1024 canvas (box from the generated parts file)
import json
box = json.load(open(os.path.join(HERE, 'work', 'parts.json')))['parts']['whole']['box']
canvas = np.zeros((1024, 1024, 4), np.uint8)
canvas[box[1]:box[1] + box[3], box[0]:box[0] + box[2]] = whole

# head + ears + a little neck, fading out below the jaw
mask = np.zeros((1024, 1024), np.uint8)
cv2.fillPoly(mask, [np.array([(60, 20), (620, 20), (620, 290), (468, 300), (446, 400), (400, 470), (240, 470), (160, 420), (60, 300)], np.int32)], 255)
fade = np.clip((470 - np.arange(1024)[:, None]) / 60.0, 0, 1)
a = canvas[..., 3].astype(np.float32) * (mask / 255.0) * fade
head = canvas.copy()
head[..., 3] = a.astype(np.uint8)
ys, xs = np.where(a > 4)
head = head[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
head = Image.fromarray(cv2.cvtColor(head, cv2.COLOR_BGRA2RGBA))


def bubble(draw, x, y, w, h, text, size):
    r = h // 2
    draw.rounded_rectangle([x, y, x + w, y + h], r, fill=(255, 255, 255), outline=INK, width=14)
    tail = [(x + w * 0.30, y + h - 10), (x + w * 0.16, y + h + 78), (x + w * 0.50, y + h - 10)]
    draw.polygon(tail, fill=(255, 255, 255))
    draw.line([tail[0], tail[1], tail[2]], fill=INK, width=14, joint='curve')
    draw.line([(x + w * 0.31, y + h - 7), (x + w * 0.49, y + h - 7)], fill=(255, 255, 255), width=16)
    font = ImageFont.truetype(FONT, size)
    tb = draw.textbbox((0, 0), text, font=font)
    draw.text((x + (w - (tb[2] - tb[0])) / 2 - tb[0], y + (h - (tb[3] - tb[1])) / 2 - tb[1]), text, font=font, fill=INK)


# icon: big head, bubble top right
icon = Image.new('RGBA', (1024, 1024), CREAM + (255,))
hw = 800
hh = int(head.height * hw / head.width)
big = head.resize((hw, hh), Image.LANCZOS)
icon.alpha_composite(big, (40, 1024 - hh + 10))
d = ImageDraw.Draw(icon)
bubble(d, 520, 60, 440, 190, 'MOO!', 128)
icon.convert('RGB').save(os.path.join(ASSETS, 'icon.png'), optimize=True)

# splash: head alone, transparent
splash = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
sw = 760
sh = int(head.height * sw / head.width)
splash.alpha_composite(head.resize((sw, sh), Image.LANCZOS), ((1024 - sw) // 2, (1024 - sh) // 2))
splash.save(os.path.join(ASSETS, 'splash-icon.png'), optimize=True)
print('icon', icon.size, 'splash', splash.size)
