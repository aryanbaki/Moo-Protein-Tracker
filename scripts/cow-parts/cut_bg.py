"""Background mask for master.png -> work/alpha.png (soft-edged, holes filled)."""
import os

import cv2
import numpy as np
from PIL import Image
from rembg import new_session, remove

HERE = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(HERE, 'work'), exist_ok=True)
im = Image.open(os.path.join(HERE, 'master.png')).convert('RGB')
m = np.array(remove(im, session=new_session('isnet-general-use'), only_mask=True))
fg = (m > 128).astype(np.uint8) * 255
# fill interior holes (the model is unsure about the cow's cream areas)
n, lab, st, _ = cv2.connectedComponentsWithStats(255 - fg, 4)
for i in range(1, n):
    if not (st[i, 0] == 0 or st[i, 1] == 0):
        fg[lab == i] = 255
n, lab, st, _ = cv2.connectedComponentsWithStats(fg, 8)
fg = np.where(lab == 1 + np.argmax(st[1:, 4]), 255, 0).astype(np.uint8)
fg = cv2.erode(fg, np.ones((3, 3), np.uint8))
cv2.imwrite(os.path.join(HERE, 'work', 'alpha.png'), cv2.GaussianBlur(fg, (0, 0), 0.8))
print('mask written')
