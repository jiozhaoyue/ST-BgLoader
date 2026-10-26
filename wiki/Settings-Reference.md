# 设置项参考指南 (Settings Reference)

> 本文档为 ST-BgLoader 全部设置项的权威真源对照表。
> 代码定义见 [`src/types/index.ts`](file:///d:/Repo/Tavern-repo/My-repo/ST-BgLoader/src/types/index.ts)。

---

## 1. 设置体系概览

ST-BgLoader 的设置管理采用多层持久化体系：
1. **服务端真源持久化**：以服务端 `st-bg-loader-settings.json`（或酒馆 settings/extension 机制）为首要真源，跨浏览器或清除本地缓存后依然完好。
2. **Authority KV 镜像同步**：在安装了 Authority 宿主扩展的环境下，自动建立 KV 跨设备镜像。
3. **顶栏背景抽屉原位集成**：
   - **扩展列表面板 (`#extensions_settings`)**：极简设计，提供主总开关（`enabled`）、状态徽章与直达顶栏抽屉的入口按钮。
   - **顶栏原生背景抽屉 (`#Backgrounds`)**：由插件原位接管（夺舍），点击顶栏背景按钮即可看到「背景媒体库」与「详细设置」双标签页，全部详细视听配置均在此一站式完成。

---

## 2. 全量设置项对照表

| 设置字段名 | 类型 | 默认值 | 作用说明 | 界面入口 |
| --- | --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 扩展主总开关。关闭后完全释放对原生顶栏抽屉的接管并还原酒馆原生功能；**同时停止 BGM（300ms 淡出）与环境音**，重新开启不会自动续播（需手动恢复，避免突然出声） | 扩展面板主复选框 / 顶栏抽屉顶部 |
| `activeMediaId` | `string \| null` | `null` | 当前激活背景项的 ID 或文件名 | 背景卡片点击选中（无直接输入项） |
| `volume` | `number` | `0.8` | BGM 与视频音量 (0.0 ~ 1.0) | 顶栏抽屉 > 详细设置 > BGM与音频设置 |
| `muted` | `boolean` | `false` | 全局音频静音状态 | 顶栏抽屉 > 详细设置 > BGM与音频设置 |
| `pauseOnBlur` | `boolean` | `true` | 浏览器窗口切到后台/失焦时自动暂停视频与音频播放 | 顶栏抽屉 > 详细设置 > BGM与音频设置 |
| `filters` | `VisualFilters` | `{ blur: 0, brightness: 100, opacity: 100, saturate: 100 }` | 视听滤镜当前实时参数（模糊、亮度、不透明度、饱和度） | 顶栏抽屉 > 详细设置 > 视听滤镜与调色 |
| `activePresetId` | `string` | `'default'` | 当前选中的滤镜预设 ID（如 `cinema_dark`, `cyberpunk` 等） | 顶栏抽屉 > 详细设置 > 滤镜预设下拉框 |
| `userPresets` | `Record<string, VisualFilters>` | `{}` | 用户保存的自定义滤镜预设集合 | 预设管理操作自动存储（仅经面板存取/API） |
| `interactiveBackground` | `boolean` | `false` | HTML/SVG 动态交互网页背景是否允许鼠标事件穿透交互 | 顶栏抽屉 > 详细设置 > 视听滤镜与调色 |
| `backgroundVisible` | `boolean` | `true` | 背景图层可见性开关（隐藏时不停止音频） | 顶栏抽屉 > 详细设置 > 视听滤镜与调色 |
| `showMiniPlayer` | `boolean` | `true` | 是否在界面右下角显示浮动音乐胶囊小播放器 | 顶栏抽屉 > 详细设置 > BGM与音频设置 |
| `capsuleOnPlayOnly` | `boolean` | `true` | 迷你音乐胶囊是否仅在正在播放音频时自动显现 | 顶栏抽屉 > 详细设置 > BGM与音频设置 |
| `playbackMode` | `PlaybackMode` | `'loop'` | 播放模式：`'loop'` (循环), `'single'` (单曲), `'shuffle'` (随机) | 顶栏抽屉 > 详细设置 > BGM与音频设置 |
| `cacheQuotaMB` | `number` | `1024` | 浏览器端本地热缓存最大配额限制 (MB) | 顶栏抽屉 > 详细设置 > 缓存与存储配置 |
| `lruAutoClean` | `boolean` | `true` | 当缓存超过配额时是否自动使用 LRU 策略清理最久未访问媒体 | 顶栏抽屉 > 详细设置 > 缓存与存储配置 |
| `nativeTakeover` | `TakeoverLevel` | `'all'` | 对酒馆原生背景选择的接管级别 (`'off'`, `'non-image'`, `'all'`) | 顶栏抽屉 > 详细设置 > 高级接管模式 |
| `weather` | `WeatherOptions` | `{ type: 'off', density: 'medium', speed: 1.0, opacity: 0.75, wind: 0.5 }` | 环境粒子与天气效果（雨、雪、落樱、赛博微粒、扫描线）配置 | 顶栏抽屉 > 详细设置 > 环境天气微粒 |
| `visualizer` | `VisualizerOptions` | `{ mode: 'off', color: '#4fa3d1', sensitivity: 1.0 }` | 音频律动与频谱可视化（脉冲、频谱柱）参数 | 顶栏抽屉 > 详细设置 > 音频律动与频谱 |
| `parallax` | `{ enabled: boolean; intensity: number }` | `{ enabled: false, intensity: 0.3 }` | 鼠标移动时的 2.5D 视差微动与景深偏移效果配置 | 顶栏抽屉 > 详细设置 > 3D 视差微动 |
| `transitionEffect` | `TransitionType` | `'fade'` | 背景切换时的转场动画效果 (`fade`, `zoom_fade`, `blur_fade`, `slide_left`, `slide_right`) | 顶栏抽屉 > 详细设置 > 转场与动画效果 |
| `transitionDurationMs` | `number` | `400` | 转场动画持续时长（毫秒） | 顶栏抽屉 > 详细设置 > 转场与动画效果 |
| `muffleBGM` | `boolean` | `false` | BGM 隔音/闷音效果（开启低通滤波器模拟隔门/水下听音感） | 顶栏抽屉 > 详细设置 > BGM与音频设置 |
| `triggerRules` | `TriggerRule[]` | `[]` | 自动化场景触发器规则列表（角色卡进入、正则匹配触发） | 顶栏抽屉 > 详细设置 > 自动化触发器规则 |
| `ambientSound` | `AmbientSoundOptions` | `{ type: 'off', volume: 0.5 }` | 程序化环境白噪音发生器（雨声、篝火柴火声、风声） | 顶栏抽屉 > 详细设置 > 环境白噪音发生器 |
| `frostedChat` | `{ enabled: boolean; blur: number; opacity: number }` | `{ enabled: false, blur: 10, opacity: 75 }` | 酒馆主对话框毛玻璃通透滤镜与不透明度配置 | 顶栏抽屉 > 详细设置 > 毛玻璃对话框 UI |
| `scenes` | `Record<string, SceneSnapshot>` | `{}` | 用户保存的视听全景快照预设集合 | 顶栏抽屉 > 详细设置 > 场景预设快照 |
| `agentToolsEnabled` | `boolean` | `false` | 是否允许向酒馆 Agent Runtime 注册环境导演模式工具 | 顶栏抽屉 > 详细设置 > Authority 与 Agent 增强 |

---

## 3. 滤镜内置预设清单 (`BUILTIN_PRESETS`)

| 预设标识 (ID) | 名称 | 模糊 (`blur`) | 亮度 (`brightness`) | 不透明度 (`opacity`) | 饱和度 (`saturate`) |
| --- | --- | --- | --- | --- | --- |
| `default` | Default (原色) | 0 px | 100% | 100% | 100% |
| `cinema_dark` | Cinema Dark (影院暗调) | 3 px | 75% | 90% | 95% |
| `cyberpunk` | Cyberpunk (赛博霓虹) | 0 px | 110% | 100% | 160% |
| `vintage_sepia` | Vintage (复古胶片) | 1 px | 90% | 90% | 70% |
| `dreamy_bloom` | Dreamy (梦幻光晕) | 6 px | 125% | 95% | 115% |
| `monochrome` | Monochrome (黑白极简) | 0 px | 100% | 100% | 0% |

---

## 4. 全景场景快照清单 (`BUILTIN_SCENES`)

| 场景标识 (ID) | 显示名称 | 滤镜预设 | 天气特效 | 音频律动 | 视差微动 | 环境白噪音 | 毛玻璃 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `cyber_rain` | Cyberpunk Rain (赛博雨夜) | `cyberpunk` | `rain` (高密度) | `pulse` (青色) | 开启 (0.4) | `rain` (0.5) | 开启 |
| `cozy_fireplace` | Cozy Fireplace (壁炉夜话) | `vintage_sepia` | `cyber_motes` (暖微粒) | 关闭 | 关闭 | `fire` (0.6) | 开启 |
| `sakura_shrine` | Sakura Shrine (落樱古刹) | `dreamy_bloom` | `sakura` (高密度) | 关闭 | 开启 (0.3) | `wind` (0.4) | 开启 |
| `winter_cabin` | Winter Cabin (雪山木屋) | `cinema_dark` | `snow` (大雪) | 关闭 | 开启 (0.3) | `wind` (0.5) | 开启 |

---

## 5. 枚举类型对照表

### 5.1 天气类型 (`WeatherType`)
- `off`: 关闭天气
- `rain`: 细雨微涟
- `snow`: 冬日飘雪
- `sakura`: 落樱缤纷
- `cyber_motes`: 赛博霓虹微粒
- `scanlines`: 复古CRT扫描线

### 5.2 转场类型 (`TransitionType`)
- `fade`: 经典淡入淡出 (Cross-fade)
- `zoom_fade`: 缩放淡入 (Zoom Fade)
- `blur_fade`: 径向虚化淡入 (Blur Fade)
- `slide_left`: 向左平移滑动 (Slide Left)
- `slide_right`: 向右平移滑动 (Slide Right)

### 5.3 白噪音类型 (`AmbientSoundType`)
- `off`: 关闭白噪音
- `rain`: 真实雨声 (WebAudio 滤波粉红噪声)
- `fire`: 噼啪壁炉篝火柴火声 (白噪声 + 突发裂纹脉冲)
- `wind`: 呼啸风声 (低频带通震荡)

### 5.4 播放模式 (`PlaybackMode`)
- `loop`: 列表循环
- `single`: 单曲循环
- `shuffle`: 随机播放
