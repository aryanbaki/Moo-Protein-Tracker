"""
Cut master.png (the chosen cow) into rig parts.

Inputs : master.png, work/alpha.png (from cut_bg.py / rembg)
Outputs: ../../assets/cow/*.png (cropped, transparent), ../../src/mascot/skins/moo.parts.ts,
         work/preview_*.png (checks)

Run by hand:  python3 build.py
All coordinates are pixels of the 1024 x 1024 master, which is also the skin's viewBox.
"""
import json
import os

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'assets', 'cow')
TS = os.path.join(HERE, '..', '..', 'src', 'mascot', 'skins', 'moo.parts.ts')
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.join(HERE, 'work'), exist_ok=True)

im = cv2.imread(os.path.join(HERE, 'master.png')).astype(np.float32)
alpha = cv2.imread(os.path.join(HERE, 'work', 'alpha.png'), 0).astype(np.float32) / 255.0
H, W = alpha.shape


def poly(points, feather=0.0):
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, [np.array(points, np.int32)], 255, lineType=cv2.LINE_AA)
    m = m.astype(np.float32) / 255.0
    if feather:
        m = cv2.GaussianBlur(m, (0, 0), feather)
    return m


# ---------------------------------------------------------------- part outlines
HEAD = [(222, 38), (290, 38), (292, 100), (330, 84), (408, 96), (412, 66), (488, 66), (488, 172), (453, 184),
        (453, 256), (446, 296), (432, 330), (410, 362), (375, 390), (340, 408), (300, 420), (262, 414), (215, 396),
        (183, 352), (183, 300), (198, 268), (214, 236), (233, 214), (239, 150), (231, 120)]
EAR_L = [(70, 105), (262, 105), (262, 232), (70, 250)]          # screen-left ear (tucks under the head)
EAR_R = [(432, 168), (605, 168), (605, 292), (470, 292), (432, 262)]
TAIL = [(864, 398), (874, 440), (881, 500), (887, 560), (887, 600), (888, 622), (886, 765), (968, 765), (968, 560),
        (922, 460), (892, 398), (876, 386)]
# The part of the neck the head hides: painted in so nothing shows a hole when the head moves.
NECK_FILL = [(286, 412), (300, 416), (340, 404), (375, 386), (410, 358), (432, 326), (446, 292), (456, 250), (470, 300),
             (440, 300), (400, 318), (350, 345), (300, 368), (288, 374)]

# name: (x0, x1, cut_y, overlap, pivot)   leg = cow inside [x0, x1] below cut_y, plus `overlap` px tucked under the body
LEGS = {
    'legFR': (222, 402, 700, 44, (345, 688)),   # far front (screen-left)
    'legFL': (428, 556, 702, 44, (494, 690)),   # near front
    'legBR': (596, 762, 772, 70, (690, 745)),   # far back (behind the udder)
    'legBL': (768, 922, 722, 44, (838, 705)),   # near back
}

PIVOTS = {
    'head': (392, 345), 'earL': (246, 182), 'earR': (448, 222), 'tail': (862, 404), 'body': (560, 600),
    'eyes': (322, 240), 'mouth': (268, 398),
}
ROOT = (560, 962)

# ------------------------------------------------------------------------ masks
m_head = poly(HEAD)
m_earL = poly(EAR_L) * (1 - poly(HEAD))
m_earR = poly(EAR_R) * (1 - poly(HEAD))
m_tail = poly(TAIL)

parts = {}


def crop_save(name, rgb, a):
    a = np.clip(a, 0, 1)
    # drop specks: keep pieces of real size only
    n_c, lab_c, st_c, _ = cv2.connectedComponentsWithStats((a > 0.02).astype(np.uint8), 8)
    ok = np.zeros_like(a)
    for i_c in range(1, n_c):
        if st_c[i_c, 4] >= 400:
            ok[lab_c == i_c] = 1
    a = a * ok
    ys, xs = np.where(a > 0.004)
    pad = 2
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad + 1, W)
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, H)
    out = np.dstack([np.clip(rgb, 0, 255), a * 255]).astype(np.uint8)[y0:y1, x0:x1]
    cv2.imwrite(os.path.join(OUT, f'{name}.png'), out, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    parts[name] = {'box': [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]}
    return out


def bleed(rgb, a, n=6):
    """Push opaque colours outward under the soft edge so no backdrop tint survives (no halo)."""
    src = rgb.copy()
    known = (a > 0.9).astype(np.uint8)
    cur = src * known[..., None]
    k = np.ones((3, 3), np.uint8)
    for _ in range(n):
        grown = cv2.dilate(known, k)
        blur = cv2.blur(cur, (3, 3))
        cnt = cv2.blur(known.astype(np.float32), (3, 3))[..., None]
        fill = np.where(cnt > 0, blur / np.maximum(cnt, 1e-6), 0)
        new = (grown == 1) & (known == 0)
        cur[new] = fill[new]
        known = grown
    res = src.copy()
    edge = (a <= 0.9)
    res[edge & (known == 1)] = cur[edge & (known == 1)]
    return res


clean = bleed(im, alpha)

# head, ears, tail ----------------------------------------------------------------
# Ears tuck 14 px under the head so their roots never show a gap.
tuck = cv2.dilate(m_head, np.ones((3, 3), np.uint8), iterations=0)
ear_under = cv2.GaussianBlur(poly(HEAD), (0, 0), 1)
crop_save('head', clean, alpha * m_head)
earL_a = alpha * poly(EAR_L)
earR_a = alpha * poly(EAR_R)
# keep only a band of the head region next to the ear (the rest of the head must not ride along)
band_L = poly([(238, 120), (262, 120), (262, 205), (238, 205)], 2)
band_R = poly([(440, 186), (462, 186), (462, 252), (440, 252)], 2)
crop_save('earL', clean, earL_a * np.clip(1 - m_head + band_L, 0, 1))
crop_save('earR', clean, earR_a * np.clip(1 - m_head + band_R, 0, 1))
crop_save('tail', clean, alpha * poly(TAIL, 1.2))

# legs ---------------------------------------------------------------------------
m_legs_cut = np.zeros((H, W), np.float32)
for name, (x0, x1, cy, ov, pv) in LEGS.items():
    region = np.zeros((H, W), np.float32)
    region[cy:, x0:x1] = 1
    a_leg = alpha * region
    m_legs_cut = np.maximum(m_legs_cut, region)
    rgb = clean.copy()
    # tuck: repeat the leg's top rows upward, narrowing a little, so the top hides under the body
    row = a_leg[cy + 3]
    cols = np.where(row > 0.5)[0]
    cx0, cx1 = cols.min(), cols.max()
    top_rgb = clean[cy + 2:cy + 10, :, :].mean(axis=0)
    top_rgb = cv2.blur(top_rgb[None, :, :], (9, 1))[0]
    a_full = a_leg.copy()
    inside = cv2.erode((alpha > 0.5).astype(np.uint8), np.ones((3, 3), np.uint8), iterations=7).astype(np.float32)
    half = (cx1 - cx0) / 2.0
    mid = (cx0 + cx1) / 2.0
    for i in range(1, ov + 1):
        y = cy - i
        r = half * np.sqrt(max(0.0, 1 - (i / (ov + 1)) ** 2))   # half-ellipse dome
        xa, xb = int(mid - r), int(mid + r)
        rgb[y, cx0:cx1 + 1] = top_rgb[cx0:cx1 + 1]
        a_full[y, xa:xb + 1] = 1
    dome = cv2.GaussianBlur(a_full, (0, 0), 2.0) * np.maximum(inside, (np.arange(H)[:, None] >= cy - 4).astype(np.float32))
    a_full[:cy] = np.minimum(a_full[:cy], dome[:cy])
    a_full[:cy] *= (alpha[:cy] > 0.5)
    crop_save(name, rgb, a_full)
    PIVOTS[name] = pv

# body ---------------------------------------------------------------------------
# Everything that is not head / ears / tail / legs, with the hidden neck painted in.
neck = poly(NECK_FILL)
hole = ((m_head > 0.5) & (neck > 0.5)).astype(np.uint8) * 255
src = np.clip(clean, 0, 255).astype(np.uint8)
# make sure the inpaint only pulls colour from the body side: blank the head first
src_body = src.copy()
head_px = (m_head > 0.5)
inpaint_mask = np.zeros((H, W), np.uint8)
bx0, by0, bx1, by1 = 150, 20, 520, 460
inpaint_mask[by0:by1, bx0:bx1] = ((head_px | (alpha < 0.98) | (poly(EAR_L) > 0) | (poly(EAR_R) > 0))[by0:by1, bx0:bx1]).astype(np.uint8) * 255
filled = clean.copy()
filled[by0:by1, bx0:bx1] = cv2.inpaint(src_body[by0:by1, bx0:bx1], inpaint_mask[by0:by1, bx0:bx1], 7, cv2.INPAINT_TELEA).astype(np.float32)
filled = cv2.bilateralFilter(filled, 9, 40, 9)
# Hidden neck: carry each column's own body colour straight up under the head (cream stays cream, black stays black).
neck_rgb = filled.copy()
solid_body = (alpha > 0.98) & (poly(HEAD, 0) < 0.01)
for x in range(240, 480):
    col = np.where(solid_body[250:470, x])[0]
    if len(col) == 0:
        continue
    y0_ = 250 + col.min()
    neck_rgb[:y0_ + 2, x] = clean[y0_ + 3:y0_ + 9, x].mean(axis=0)
neck_rgb = cv2.GaussianBlur(neck_rgb, (0, 0), 2.5)
body_rgb = np.where((poly(HEAD, 1.5) > 0.01)[..., None], neck_rgb, clean)
edge_mix = poly(HEAD, 3.0)[..., None]
body_rgb = body_rgb * np.clip(edge_mix * 3, 0, 1) + clean * (1 - np.clip(edge_mix * 3, 0, 1))

leg_cut_soft = cv2.GaussianBlur(m_legs_cut, (0, 0), 5.0)
remove = np.clip(np.maximum.reduce([m_earL * (1 - cv2.GaussianBlur(neck, (0, 0), 1)), m_earR, poly(TAIL, 0.6), leg_cut_soft]), 0, 1)
neck_soft = cv2.GaussianBlur(cv2.dilate(neck, np.ones((3, 3), np.uint8), iterations=6), (0, 0), 2.0)
head_gone = poly(HEAD, 1.0) * (1 - neck_soft)
body_a = alpha * (1 - remove) * (1 - head_gone)
# inside the neck fill the cow's own alpha is head alpha: force opaque there
body_a = np.maximum(body_a, neck_soft * alpha * (cv2.dilate(m_head, np.ones((3, 3), np.uint8), iterations=5) > 0.5))
# drop stray specks: keep the one big piece
n_, lab_, st_, _c = cv2.connectedComponentsWithStats((body_a > 0.3).astype(np.uint8), 8)
keep = (lab_ == (1 + np.argmax(st_[1:, 4]))).astype(np.uint8)
body_a *= cv2.dilate(keep, np.ones((5, 5), np.uint8))
crop_save('body', body_rgb, body_a)

# whole cow (fill view ghost, icon source) and head-only silhouette -----------------
whole_px = crop_save('whole', clean, alpha)
# The whole cow is only ever shown faded (fill view) or scaled down (icon): store it as WebP to save app size.
from PIL import Image as _Image
_Image.fromarray(cv2.cvtColor(whole_px, cv2.COLOR_BGRA2RGBA)).save(os.path.join(OUT, 'whole.webp'), quality=92, method=6, exact=True)
os.remove(os.path.join(OUT, 'whole.png'))


# ---------------------------------------------------------------------- outlines
def trace(mask, eps=1.2):
    cs, _ = cv2.findContours((mask > 0.5).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=cv2.contourArea)
    c = cv2.approxPolyDP(c, eps, True)[:, 0, :]
    return 'M' + ' L'.join(f'{int(x)} {int(y)}' for x, y in c) + ' Z'


sil = trace(alpha)
head_sil = trace(alpha * np.clip(m_head + poly(EAR_L) + poly(EAR_R), 0, 1))
ys = np.where(alpha.max(axis=1) > 0.5)[0]
hys = np.where((alpha * np.clip(m_head + poly(EAR_L) + poly(EAR_R), 0, 1)).max(axis=1) > 0.5)[0]

# ------------------------------------------------------------------------ emit ts
order = ['whole', 'body', 'head', 'earL', 'earR', 'tail', 'legFL', 'legFR', 'legBL', 'legBR']
lines = ['/**', ' * GENERATED by scripts/cow-parts/build.py. Do not edit by hand: change the script and re-run it.',
         ' * Boxes and pivots are pixels of the 1024 x 1024 master image (the skin viewBox).', ' */',
         "import type { ImageSourcePropType } from 'react-native';", '',
         'export interface CowImagePart {', '  source: ImageSourcePropType;',
         '  /** x, y, width, height in viewBox units. */', '  box: readonly [number, number, number, number];', '}', '',
         'export const IMAGES = {']
for n in order:
    b = parts[n]['box']
    ext = 'webp' if n == 'whole' else 'png'
    lines.append(f"  {n}: {{ source: require('../../../assets/cow/{n}.{ext}'), box: [{b[0]}, {b[1]}, {b[2]}, {b[3]}] }},")
lines += ['} as const satisfies Record<string, CowImagePart>;', '', 'export const PIVOTS = {']
for n, (x, y) in PIVOTS.items():
    lines.append(f'  {n}: [{x}, {y}],')
lines += ['} as const;', '', f'export const ROOT_PIVOT = [{ROOT[0]}, {ROOT[1]}] as const;', '',
          f"export const SILHOUETTE = '{sil}';", '', f"export const HEAD_SILHOUETTE = '{head_sil}';", '',
          f'export const FILL_RANGE = {{ top: {int(ys.min())}, bottom: {int(ys.max())} }} as const;',
          f'export const HEAD_FILL_RANGE = {{ top: {int(hys.min())}, bottom: {int(hys.max())} }} as const;', '']
open(TS, 'w').write('\n'.join(lines))
json.dump({'parts': parts, 'pivots': PIVOTS, 'root': ROOT}, open(os.path.join(HERE, 'work', 'parts.json'), 'w'), indent=1)


# ----------------------------------------------------------------- check renders
def load(name):
    p = cv2.imread(os.path.join(OUT, f'{name}.png'), cv2.IMREAD_UNCHANGED).astype(np.float32)
    x, y, w, h = parts[name]['box']
    full = np.zeros((H, W, 4), np.float32)
    full[y:y + h, x:x + w] = p
    return full


def over(dst, src):
    a = src[..., 3:4] / 255.0
    dst[..., :3] = src[..., :3] * a + dst[..., :3] * (1 - a)
    dst[..., 3:4] = np.maximum(dst[..., 3:4], src[..., 3:4])
    return dst


def xf(img, pivot, deg=0.0, dx=0, dy=0):
    M = cv2.getRotationMatrix2D(pivot, -deg, 1.0)
    M[0, 2] += dx
    M[1, 2] += dy
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)


Z = ['tail', 'legBR', 'legFR', 'legBL', 'legFL', 'body', 'earL', 'earR', 'head']


def render(pose, bg=(255, 0, 255)):
    canvas = np.zeros((H, W, 4), np.float32)
    canvas[..., :3] = bg
    hd = pose.get('head', (0, 0, 0))
    for n in Z:
        img = load(n)
        d = pose.get(n, (0, 0, 0))
        img = xf(img, PIVOTS[n], *d)
        if n in ('earL', 'earR'):
            img = xf(img, PIVOTS['head'], *hd)
        over(canvas, img)
    return canvas[..., :3].astype(np.uint8)


rest = render({})
moved = render({'head': (9, 0, 6), 'earL': (-14, 0, 0), 'earR': (12, 0, 0), 'tail': (-16, 0, 0), 'legFL': (-12, 0, 0),
                'legFR': (11, 0, 0), 'legBL': (10, 0, 0), 'legBR': (-11, 0, 0)})
moved2 = render({'head': (-9, 0, -4), 'earL': (12, 0, 0), 'earR': (-12, 0, 0), 'tail': (18, 0, 0), 'legFL': (12, 0, 0),
                 'legFR': (-11, 0, 0), 'legBL': (-10, 0, 0), 'legBR': (11, 0, 0)})
cv2.imwrite(os.path.join(HERE, 'work', 'preview_rest.png'), cv2.resize(rest, (800, 800), interpolation=cv2.INTER_AREA))
cv2.imwrite(os.path.join(HERE, 'work', 'preview_moved.png'), cv2.resize(moved, (800, 800), interpolation=cv2.INTER_AREA))
cv2.imwrite(os.path.join(HERE, 'work', 'preview_moved2.png'), cv2.resize(moved2, (800, 800), interpolation=cv2.INTER_AREA))
orig = np.zeros((H, W, 3), np.float32)
orig[:] = (255, 0, 255)
orig = (im * alpha[..., None] + orig * (1 - alpha[..., None]))
diff = np.abs(rest.astype(np.float32) - orig).max(axis=2)
print('rest vs original: max diff', float(diff.max()), 'pixels >24:', int((diff > 24).sum()))
bodyonly = np.zeros((H, W, 4), np.float32)
bodyonly[..., :3] = (255, 0, 255)
over(bodyonly, load('body'))
cv2.imwrite(os.path.join(HERE, 'work', 'preview_body.png'), cv2.resize(bodyonly[..., :3].astype(np.uint8), (800, 800), interpolation=cv2.INTER_AREA))
print('sizes kB:', {f: os.path.getsize(os.path.join(OUT, f)) // 1024 for f in sorted(os.listdir(OUT))})
