# Design: 修复扩展设置面板对齐与展开交互

## 1. 架构与根因分析

### 1.1 根因分析
1. **宽度缩进 20px（两侧各 10px）**:
   - `SettingsDrawer.ts` 在挂载进入 `#extensions_settings` 时，将根元素设置为 `<div id="st_bgloader_settings" class="st-bgloader-panel">`；
   - 在 `src/ui/style.css` 中，`.st-bgloader-panel` 声明了 `display: flex; flex-direction: column; gap: 15px; padding: 10px;`；
   - 宿主原生及规范扩展在 `#extensions_settings` 均使用 `.extension_container`，而在宿主样式 `public/css/extensions-panel.css` 中，`.extension_container` 定义为 `display: contents;`；
   - 结果：ST-BgLoader 未使用 `extension_container`，而是由 `st-bgloader-panel` 产生了 `padding: 10px`，导致其内部的 `.inline-drawer-header` 宽度比整列其他扩展少整整 20px，在视觉上形成明显的内凹缩进缺陷。
2. **边缘点击死区与展开失败体验**:
   - 由于外层存在 10px 的 padding 边框，用户点击行边沿或右侧 chevron 所在坐标时，实际命中容器而非 `.inline-drawer-toggle`，造成点击无效；
   - 此外，在缺少原生 jQuery 委托环境或动态加载脱节时，缺少自主的安全兜底折叠逻辑。

### 1.2 解决方案
1. **重构 DOM 结构为标准规范**:
   ```html
   <div id="st_bgloader_container" class="extension_container" data-extension-name="ST-BgLoader">
       <div id="st_bgloader_settings" class="inline-drawer">
           <div class="inline-drawer-toggle inline-drawer-header">
               <b><i class="fa-solid fa-photo-film"></i> <span data-i18n="ST-BgLoader (富媒体背景与视听增强)">ST-BgLoader (富媒体背景与视听增强)</span></b>
               <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
           </div>
           <div class="inline-drawer-content">
               <div class="st-bgloader-master-card">
                   ...
               </div>
           </div>
       </div>
   </div>
   ```
2. **CSS 调整**:
   - 确保 `#st_bgloader_container` 保持 `display: contents;` 且 `padding: 0; margin: 0;`；
   - 确保 `#st_bgloader_settings.inline-drawer` 占满 100% 宽度，与其他扩展完全齐平；
   - 将 `.st-bgloader-panel` 相关的样式范围隔离，仅对内部独立卡片生效，不污染外层抽屉容器。
3. **稳健的双重事件支持**:
   - 保留宿主 jQuery `$(document).on('click', '.inline-drawer-toggle')` 原生通道；
   - 增加监听宿主 `inline-drawer-toggle` 自定义事件；若在延迟时间内未捕获到宿主响应，则自动以原生方式切换 `content` 与 `icon`，确保 100% 可展开折叠，同时互斥无冲突。
