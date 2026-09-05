# Atmospheric Weather Engine (微粒天气与氛围系统)

`AtmosphereFX` 是 ST-BgLoader 内置的超轻量、高性能 2D 粒子与着色物理引擎。它在背景层之上以原生 HTML5 Canvas 方式实时模拟各种天气与环境氛围。

---

## 🎨 天气特效一览 (Presets & Visuals)

| 天气特效 ID | 名称与视觉风格 | 物理模拟细节 |
| :--- | :--- | :--- |
| `rain` | **细雨微涟 (Rain & Ripples)** | 倾斜雨丝随风向偏移下落；落至屏幕底部时以 15% 概率生成椭圆水花涟漪并逐渐扩大扩散淡出。 |
| `snow` | **冬日飘雪 (Drifting Snow)** | 具有不同层级大小与透明度的雪花颗粒，结合正弦波振荡函数 (`sin(t)`) 实现柔和左右回旋漫步降落。 |
| `sakura` | **落樱缤纷 (Sakura Petals)** | 模拟椭圆花瓣形状 (`ellipse`)，带有自转角速度 (`vRotation`) 与风阻漂移，呈现唯美落花轨迹。 |
| `cyber_motes` | **赛博霓虹微粒 (Cyber Motes)** | 赛博青 (`#00f0ff`)、电光粉 (`#ff007f`)、紫罗兰 (`#7928ca`) 霓虹光晕微粒，带发光投影 (`shadowBlur: 8`) 与对流向上浮升。 |
| `scanlines` | **复古 CRT 扫描线 (Scanlines)** | 电子阴极射线管质感，包含周期性横向扫描黑带、自上而下滚动的亮度扫描波束与轻微随机显像管微闪。 |
| `off` | **关闭 (Zero Overhead)** | 立即取消动画帧，隐藏 Canvas 并释放全部微粒内存，确保 CPU 0% 开销。 |

---

## ⚙️ 核心参数调节 (Parameters)

在控制抽屉或通过 API 调用时，支持以下参数细调：

```typescript
export interface WeatherOptions {
    type: 'off' | 'rain' | 'snow' | 'sakura' | 'cyber_motes' | 'scanlines';
    density: 'low' | 'medium' | 'high'; // 微粒密度 (基准数量分别为 0.5x, 1.0x, 2.0x)
    speed: number;                      // 运动速率 (0.5x 至 2.5x)
    opacity: number;                    // 整体微粒透明度 (0.1 至 1.0)
    wind: number;                       // 水平风力分量 (-2.0 至 2.0)
}
```

---

## 🏎️ 极限性能优化哲学 (Performance Optimizations)

为确保在低配笔记本、核显或移动端浏览器上流畅跑满 60/120 FPS，`AtmosphereFX` 实现了以下关键优化：

1. **Retina/4K 屏幕倍率夹紧 (DPR Clamping)**：
   高分屏（如 3x Retina 屏）全屏重绘 Canvas 会消耗数倍 GPU 填充率。引擎将 `dpr` 严格夹紧在 `Math.min(window.devicePixelRatio || 1, 2)`，兼顾超清边缘与极低显存带宽。
2. **粒子对象池与循环复用 (Particle Reusing)**：
   飞出屏幕边缘的微粒不会被 `delete` 或触发垃圾回收 (GC)，而是瞬间重置其 `x, y` 坐标回到屏幕上方重新下落，垃圾回收暂停时间降至 0。
3. **ResizeObserver 智能动态重构**：
   监听主宿主容器尺寸变化，窗口缩放时自动重置画布尺寸与微粒坐标系，防止画面拉伸模糊。
4. **完全停止机制**：
   当设为 `off` 时，彻底调用 `cancelAnimationFrame` 并隐藏 DOM，不留常驻计时器。
