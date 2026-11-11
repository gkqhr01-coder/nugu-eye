"""D안 카드용 반반 이미지 생성. index.html 엔진 공식을 파이썬으로 근사.
왼쪽 절반 = 원본, 오른쪽 절반 = 시선 필터. 출력 968x346 (카드 484x173 @2x)."""
import sys
import numpy as np
from PIL import Image, ImageFilter

SRC, OUT = sys.argv[1], sys.argv[2]
W, H = 968, 346
FOV = 65.0
DEUT = np.array([[0.367322, 0.860646, -0.227968],
                 [0.280085, 0.672501, 0.047413],
                 [-0.011820, 0.042940, 0.968881]])


def lin(a):
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)


def srgb(a):
    a = np.clip(a, 0, 1)
    return np.where(a <= 0.0031308, a * 12.92, 1.055 * a ** (1 / 2.4) - 0.055)


def crop(img, cx, cy, scale):
    """cx, cy: 0~1 crop center; scale: crop width / image width."""
    iw, ih = img.size
    cw = iw * scale
    ch = cw * H / W
    x0 = min(max(cx * iw - cw / 2, 0), iw - cw)
    y0 = min(max(cy * ih - ch / 2, 0), ih - ch)
    return img.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch))).resize((W, H), Image.LANCZOS)


def blur_px(cpd, boost):
    sdeg = 0.34 * np.sqrt(max(1 / cpd ** 2 - 1 / 30 ** 2, 0)) * boost
    return sdeg * W / FOV


def blur(arr, r):
    if r < 0.3:
        return arr
    im = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(float(r)))).astype(np.float64) / 255


def saturate(l, s):
    y = (l @ np.array([0.2126, 0.7152, 0.0722]))[..., None]
    return y + (l - y) * s


MODE = sys.argv[3]
cfg = dict(arg.split('=') for arg in sys.argv[4:])
img = Image.open(SRC).convert('RGB')
img = crop(img, float(cfg.get('cx', .5)), float(cfg.get('cy', .5)), float(cfg.get('scale', 1)))
base = np.asarray(img).astype(np.float64) / 255
L = lin(base)
dim = float(cfg.get('dim', 1))      # 장면을 어둡게 (해 질 녘 흉내)
L = L * dim
left = srgb(L)

if MODE == 'dog':
    f = np.clip(L @ DEUT.T, 0, 1)
    f = f ** (1 / 0.88) if False else f
    out = srgb(f)
    out = blur(out, blur_px(8, float(cfg.get('boost', 1.5))))
elif MODE == 'cat':
    f = np.clip(L * float(cfg.get('gain', 3.2)), 0, 1)   # 밤눈: 빛을 더 모음
    f = f ** 0.75
    f = np.clip(f @ DEUT.T, 0, 1)
    f = np.clip(saturate(f, 0.6), 0, 1)
    out = srgb(f)
    out = blur(out, blur_px(8.6, float(cfg.get('boost', 1.5))))
elif MODE == 'baby':
    f = saturate(L, 0.85)
    f = 0.5 + (f - 0.5) * 0.9
    out = srgb(np.clip(f, 0, 1))
    sharp = blur(out, blur_px(5, float(cfg.get('boost', 1.5))))
    soft = blur(out, blur_px(5, 10))
    soft = srgb(np.clip(saturate(lin(soft), 0.5), 0, 1))
    # 시야: 가운데(분할선 쪽 얼굴)에서 멀어질수록 흐리고 옅게
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt(((xx - W * float(cfg.get('fx', .5))) / (W * .5)) ** 2 + ((yy - H * float(cfg.get('fy', .5))) / (H * .9)) ** 2)
    m = np.clip((d - float(cfg.get("m0", .22))) / 0.38, 0, 1)[..., None]
    out = sharp * (1 - m) + soft * m
else:
    raise SystemExit('mode?')

res = np.concatenate([left[:, :W // 2], out[:, W // 2:]], axis=1)
res[:, W // 2 - 2:W // 2 + 2] = 1.0
Image.fromarray((np.clip(res, 0, 1) * 255).astype(np.uint8)).save(OUT, quality=88)
print('saved', OUT)
