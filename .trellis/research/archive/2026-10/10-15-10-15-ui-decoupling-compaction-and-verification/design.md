# Technical Design: UI Decoupling, Text Compaction, Performance Optimization & Verification

## 1. Architecture: UIComponent Factory (`src/ui/UIComponents.ts`)

To eliminate duplicate string concatenations, repeated inline templates, and scattered event bindings across `SettingsDrawer.ts` and `TopbarBackgroundDrawer.ts`, create a decoupled component factory:

- `renderSection(opts: { title: string; icon: string; childrenHtml: string }): string`
- `renderSlider(opts: { id: string; valId: string; label: string; min: number; max: number; step: number; value: number; unit?: string }): string`
- `renderSelect(opts: { id: string; label: string; options: Array<{ value: string; label: string; selected?: boolean }> }): string`
- `renderCheckbox(opts: { id: string; label: string; checked: boolean; sub?: boolean }): string`
- `renderButton(opts: { id: string; icon?: string; label: string; variant?: 'normal' | 'danger' | 'full'; disabled?: boolean }): string`
- `bindSliderRAF(container: HTMLElement, id: string, valId: string, unit: string, onChange: (v: number) => void): void`
  - Encapsulates `requestAnimationFrame` scheduling, preventing duplicate DOM recalculations during slider drag.

## 2. Text & Layout Compaction Protocol

- Remove all subheaders, descriptive notes, parentheses `(...)`, and compound "与" phrases.
- Shorten section headers to single or two-character nouns:
  - 场景 (Scene)
  - 滤镜 (Filters)
  - 天气 (Weather)
  - 动效 (Motion / Visualizer)
  - 音效 (Soundscape)
  - 毛玻璃 (Frosted Glass)
  - 转场 (Transition)
  - 音乐 (Music / Audio)
  - 触发器 (Triggers)
  - 存储 (Storage / Cache)
  - 云端 (Cloud)
- All button texts ≤ 4 chars: 应用, 保存, 删除, 添加, 导出, 导入, 清空, 播放, 暂停, 展开, 收起, 设置.
- Compress CSS margins & paddings:
  - Section margin-bottom: 6px
  - Section padding: 8px
  - Dropzone padding: 10px
  - Grid gap: 6px

## 3. Performance Optimizations

- Batch DOM updates using `DocumentFragment` for media card list rendering.
- Raf-throttled slider changes for CSS filter updates.
- Parallax mousemove listener passive & throttled.

## 4. Verification & Automated Screen Audit

- Create `tests/verify-ui-compact.mjs`.
- Launch Puppeteer against `https://localhost:8003`.
- Capture full screenshots of Settings Drawer, Topbar Drawer (Library tab & Settings tab), and MiniPlayer.
- Programmatically scan text content:
  - Assert NO text contains "与".
  - Assert NO text contains parentheses `(` or `)`.
  - Assert NO unescaped HTML characters (`&lt;`, `undefined`).
  - Assert NO zero-size or inverted layout anomalies.
