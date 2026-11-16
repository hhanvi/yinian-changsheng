# 青崖山水主视觉

文件：

- `qingya-panorama.jpg`，1536 × 864，桌面横幅，373 KB
- `qingya-panorama-mobile.jpg`，832 × 1216，手机竖幅，272 KB

用途：开场背景、创建页背景、山门页横卷与新手引导插图。舆图已移除；建筑详情中的小景仍由原生 SVG 绘制。

## 生成方式

本机 ComfyUI 0.45.0 + SDXL Base 1.0，PyTorch cu128，RTX 5060 8GB。

- 采样器：DPM++ 2M Karras
- 步数：30
- CFG：6.5
- 桌面种子：20261119
- 手机种子：20261120
- 负向提示词：`text, watermark, logo, signature, UI, frame, border, modern buildings, city, people, blurry, low quality, deformed architecture, duplicate, cropped, oversaturated, neon`

## 桌面提示词

Blue-green shanshui landscape in the style of traditional Chinese mineral pigment painting, wide 16:9 panorama, layered jade mountains, secluded sect courtyards and pavilions, winding stone steps, pines, mist, waterfall, cloud sea, refined gold outlines, elegant, serene, no text, no people, no UI.

## 手机提示词

Blue-green shanshui landscape in the style of traditional Chinese mineral pigment painting, vertical composition, tall hanging scroll, layered jade mountains, secluded sect courtyards and pavilions, winding stone steps, pines, mist, waterfall, cloud sea, refined gold outlines, elegant, serene, no text, no people, no UI.

## 色彩

石青、石绿、云白、淡金。界面继续使用松绿、宣纸与淡金作为操作色；插画只负责氛围，不承载可点击信息。
