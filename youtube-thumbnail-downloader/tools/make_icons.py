#!/usr/bin/env python3
"""拡張機能のアイコン (16/48/128 px) を生成する。

外部ライブラリを使わず、標準の zlib だけで PNG を書き出す。
デザインを変えたくなったら数値を書き換えて再実行するだけでよい。

    python3 tools/make_icons.py
"""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

# 見た目の設定（すべて 0.0〜1.0 の相対座標）
BACKGROUND = (0xE6, 0x22, 0x2E, 0xFF)   # YouTube 寄りの赤
FOREGROUND = (0xFF, 0xFF, 0xFF, 0xFF)   # 下向き矢印
CORNER_RADIUS = 0.22
SUPERSAMPLE = 4                         # 1 ピクセルあたり 4x4 で平均してギザギザを消す

ARROW_STEM = (0.42, 0.20, 0.58, 0.52)              # left, top, right, bottom
ARROW_HEAD = ((0.30, 0.48), (0.70, 0.48), (0.50, 0.74))
ARROW_TRAY = (0.26, 0.80, 0.74, 0.88)              # left, top, right, bottom

SIZES = (16, 48, 128)


def in_rounded_rect(x: float, y: float, radius: float) -> bool:
    """角を丸めた正方形（辺の長さ 1.0）の内側かどうか。"""
    # 中心に近い十字部分は角丸の影響を受けない。
    if radius <= x <= 1 - radius or radius <= y <= 1 - radius:
        return 0 <= x <= 1 and 0 <= y <= 1

    corner_x = radius if x < 0.5 else 1 - radius
    corner_y = radius if y < 0.5 else 1 - radius
    return (x - corner_x) ** 2 + (y - corner_y) ** 2 <= radius**2


def in_rect(x: float, y: float, rect: tuple[float, float, float, float]) -> bool:
    left, top, right, bottom = rect
    return left <= x <= right and top <= y <= bottom


def in_triangle(x: float, y: float, triangle) -> bool:
    """3 点それぞれに対する外積の符号が揃っていれば内側。"""
    (ax, ay), (bx, by), (cx, cy) = triangle

    def cross(px, py, qx, qy, rx, ry):
        return (qx - px) * (ry - py) - (qy - py) * (rx - px)

    d1 = cross(ax, ay, bx, by, x, y)
    d2 = cross(bx, by, cx, cy, x, y)
    d3 = cross(cx, cy, ax, ay, x, y)
    return not ((d1 < 0 or d2 < 0 or d3 < 0) and (d1 > 0 or d2 > 0 or d3 > 0))


def sample(x: float, y: float) -> tuple[int, int, int, int] | None:
    """相対座標 1 点の色。背景の外なら None（＝透明）。"""
    if not in_rounded_rect(x, y, CORNER_RADIUS):
        return None
    if in_rect(x, y, ARROW_STEM) or in_rect(x, y, ARROW_TRAY) or in_triangle(x, y, ARROW_HEAD):
        return FOREGROUND
    return BACKGROUND


def render(size: int) -> bytes:
    """RGBA のピクセル列を作る。"""
    pixels = bytearray()
    step = 1.0 / (size * SUPERSAMPLE)

    for row in range(size):
        for column in range(size):
            totals = [0, 0, 0, 0]
            for sub_y in range(SUPERSAMPLE):
                for sub_x in range(SUPERSAMPLE):
                    x = (column * SUPERSAMPLE + sub_x + 0.5) * step
                    y = (row * SUPERSAMPLE + sub_y + 0.5) * step
                    color = sample(x, y)
                    if color is None:
                        continue
                    # アルファを掛けてから足す（透明部分が黒く滲まないように）
                    for channel in range(3):
                        totals[channel] += color[channel]
                    totals[3] += color[3]

            samples = SUPERSAMPLE * SUPERSAMPLE
            alpha = totals[3] // samples
            if alpha == 0:
                pixels.extend((0, 0, 0, 0))
                continue

            covered = max(1, round(totals[3] / 255))
            pixels.extend(
                (
                    totals[0] // covered,
                    totals[1] // covered,
                    totals[2] // covered,
                    alpha,
                )
            )

    return bytes(pixels)


def write_png(path: Path, size: int, pixels: bytes) -> None:
    # 各行の先頭にフィルタ種別 0（None）を付ける。
    raw = bytearray()
    stride = size * 4
    for row in range(size):
        raw.append(0)
        raw.extend(pixels[row * stride : (row + 1) * stride])

    def chunk(kind: bytes, data: bytes) -> bytes:
        return (
            struct.pack('>I', len(data))
            + kind
            + data
            + struct.pack('>I', zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    header = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)  # 8bit RGBA
    png = (
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', header)
        + chunk(b'IDAT', zlib.compress(bytes(raw), 9))
        + chunk(b'IEND', b'')
    )
    path.write_bytes(png)


def main() -> None:
    icons_dir = Path(__file__).resolve().parent.parent / 'icons'
    icons_dir.mkdir(parents=True, exist_ok=True)

    for size in SIZES:
        path = icons_dir / f'icon{size}.png'
        write_png(path, size, render(size))
        print(f'{path.name} ({size}x{size}) を書き出しました')


if __name__ == '__main__':
    main()
