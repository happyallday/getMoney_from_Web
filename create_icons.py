#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
图标生成脚本 - 为浏览器extension创建简单图标
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("PIL not available, creating basic icons")

def create_basic_icon(size, name):
    """创建基础图标"""
    try:
        # 创建一个简单的彩色圆圈图标
        if PIL_AVAILABLE:
            # 使用PIL创建更好的图标
            img = Image.new('RGBA', (size, size), (102, 126, 234, 255))  # 紫色背景
            draw = ImageDraw.Draw(img)

            # 添加一个礼包图标
            draw.rectangle([size//4, size//2-2, size*3//4, size//2+2], fill=(255, 255, 255, 255))
            draw.rectangle([size//2-2, size//4, size//2+2, size*3//4], fill=(255, 255, 255, 255))
            draw.rectangle([size//2-5, size//2-5, size//2+5, size//2-1], fill=(255, 255, 255, 255))

            img.save(f'browser-extension/icons/{name}.png')
            print(f"Created {name}.png ({size}x{size})")
        else:
            # 创建最简单的PNG文件（1x1像素，透明）
            import struct

            # 创建最简单的PNG头
            width = size
            height = size

            # PNG文件签名
            png_signature = b'\x89PNG\r\n\x1a\n'

            # IHDR chunk
            ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)  # 8-bit RGBA
            ihdr_chunk = b'IHDR' + ihdr + calculate_crc(ihdr)

            # 简单的图像数据（透明）
            pixels = b'\x00' * (width * height * 4)
            image_data = compress_data(pixels)
            idat_chunk = b'IDAT' + image_data + calculate_crc(image_data)

            # IEND chunk
            iend_chunk = b'IEND' + calculate_crc(b'')

            # 写入文件
            with open(f'browser-extension/icons/{name}.png', 'wb') as f:
                f.write(png_signature)
                f.write(ihdr_chunk)
                f.write(idat_chunk)
                f.write(iend_chunk)

            print(f"Created basic {name}.png ({size}x{size})")

    except Exception as e:
        print(f"Error creating {name}.png: {e}")
        # 创建空的PNG文件以避免加载错误
        with open(f'browser-extension/icons/{name}.png', 'wb') as f:
            # 写入最小的有效PNG文件
            f.write(b'\x89PNG\r\n\x1a\n')
            # IHDR (1x1 pixel)
            f.write(b'\x00\x00\x00\x0d')  # chunk length
            f.write(b'IHDR')
            f.write(b'\x00\x00\x00\x01')  # width = 1
            f.write(b'\x00\x00\x00\x01')  # height = 1
            f.write(b'\x08\x06\x00\x00\x00')  # bit depth=8, color type=6 (RGBA)
            # CRC
            f.write(b'\x1f\x15\xc4\x89')
            # IDAT (minimal data)
            f.write(b'\x00\x00\x00\x0c')  # chunk length
            f.write(b'IDAT')
            f.write(b'\x78\x9c\x62\x00\x01\x00\x00\x05\x00\x01')  # compressed data
            # CRC
            f.write(b'\x0d\x0a\x2d\xb4')
            # IEND
            f.write(b'\x00\x00\x00\x00')  # chunk length
            f.write(b'IEND')
            # CRC
            f.write(b'\xae\x42\x60\x82')

        print(f"Created minimal {name}.png")

def calculate_crc(data):
    """计算CRC32"""
    import zlib
    return struct.pack('>I', zlib.crc32(data))

def compress_data(data):
    """使用zlib压缩数据"""
    import zlib
    return zlib.compress(data)

if __name__ == '__main__':
    import struct
    import zlib
    import os

    # 确保图标目录存在
    os.makedirs('browser-extension/icons', exist_ok=True)

    # 创建不同尺寸的图标
    sizes = [16, 48, 128]
    for size in sizes:
        create_basic_icon(size, f'icon{size}')

    print("Icon generation completed!")