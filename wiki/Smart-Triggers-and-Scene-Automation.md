# Smart Triggers & Scene Automation (智能场景触发器)

ST-BgLoader 内置了事件驱动的智能场景联动引擎 (`TriggerManager`)。它可以深度监听 SillyTavern 的会话事件，实现**角色进场、场景变换、剧情对白全自动联动**！

---

## 🎯 触发器类型 (Trigger Dimensions)

| 类型 (`type`) | 匹配源 | 典型应用场景 |
| :--- | :--- | :--- |
| `character` | 当前选中的角色名称 | 切换到该角色专属的居室背景、主题 BGM 与专属滤镜调色 |
| `chat` | 会话聊天室 ID (`chatId`) | 即使同一个角色，不同聊天支线自动绑定不同场景（如酒馆、探险、旅馆） |
| `regex` | 消息文本内容 (包含动作旁白 `*...*`) | 对话中出现下雨、战斗、夜晚等情节时，自动触发天气或变奏 |

---

## 🎬 联动执行动作 (Composite Actions)

当规则匹配成功时，可同时自动触发以下任意动作组合：
- **`mediaIdOrUrl`**：自动平滑切换背景（视频、HTML 沙箱或高清图片）；
- **`bgmUrl`**：自动淡入播放指定背景音乐；
- **`weather`**：自动开启或切换对应天气特效（`rain`, `snow`, `sakura`, `cyber_motes`, `scanlines`）；
- **`preset`**：自动应用色彩滤镜预设（如 `cyberpunk`, `cinema_dark`, `vintage_sepia`）；
- **`filters`**：微调特定虚化、亮度或饱和度。

---

## ⚡ 对白正则触发实战案例 (Regex Example)

假设你正在与角色展开奇幻冒险，配置以下规则：

### 案例 1：剧情中开始下雨
- **规则类型**：`regex`
- **匹配模式**：`(雨|rain|drizzle|storm|雷雨)`
- **触发动作**：
  ```json
  {
    "weather": "rain",
    "preset": "cinema_dark",
    "bgmUrl": "https://assets.example.com/audio/rain-ambient.mp3"
  }
  ```
- **效果**：当 AI 回复中出现“*窗外突然下起了淅淅沥沥的细雨...*”，背景自动变暗、下雨微粒与水花涟漪自动展开，雨声 BGM 自动奏响！

### 案例 2：进入赛博战斗场景
- **规则类型**：`regex`
- **匹配模式**：`(拔出光刃|拔枪|战斗|combat|cyber|警报)`
- **触发动作**：
  ```json
  {
    "weather": "cyber_motes",
    "preset": "cyberpunk"
  }
  ```

---

## 🛡️ 防抖与防刷屏机制 (Deduplication)

为了避免连续打字或流式生成 (Streaming generation) 时频繁高频触发，`TriggerManager` 内置了：
1. **500ms 重复触发抑制**：相同规则在 500ms 内不会重复执行；
2. **正则安全沙箱**：捕获异常正则表达式，避免非法正则输入导致前端崩溃；
3. **静默降级**：如果触发动作指定的媒体不存在，自动忽略报错，不打断主聊天流。

---

## 🖥️ 在设置抽屉中管理规则

1. 打开 **ST-BgLoader** 设置抽屉；
2. 找到 **Smart Scene Triggers** 区域；
3. 点击 **+ Add Scene Trigger Rule**；
4. 按提示输入规则名称、匹配类型（`character` / `chat` / `regex`）与匹配字符串；
5. 可在列表中随时勾选启用/禁用该规则，或点击垃圾桶图标删除。
