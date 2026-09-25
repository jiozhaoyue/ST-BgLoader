# 实现清单 — P3 改进批

> 复选框随执行实时勾选（L0-2）。验证命令集中在文末。

## Phase A：激活与基线

- [x] A1 任务激活（jsonl 清单 + start）
- [x] A2 基线确认：`git status` 干净、type-check + build 绿（HEAD 2dc83b0 起点即上任务终验态，三套件已全绿）

## Phase B：装配与设置（P3-1/2/3）

- [x] B1 types 新增 `mergeSettings`，接入 index.ts loadSettings / reconcileSettings / SettingsDrawer 导入三处
- [x] B2 bootstrap 两条路径加 `.catch` 兜底日志
- [x] B3 SceneManager 懒创建 + PublicAPI 四调用点空值安全
- [x] B4 `npx tsc --noEmit` 快验

## Phase C：持久化（P3-6/11）

- [x] C1 ServerOrigin.saveManifest promise 链单飞
- [x] C2 ServerSettings.flush 写前 revision 冲突检测 + `onRemoteNewer` 回调；index.ts 接线 reconcileRemoteConflict（in-flight 守卫）
- [x] C3 `npx tsc --noEmit` 快验

## Phase D：媒体与 iframe（P3-7/5）

- [x] D1 IframeRenderer.postMessage origin 收紧 + 信任边界注释
- [x] D2 MediaMount pump 包裹层（创建/复用两路径 + getter）+ AudioVisualizer pulse 改写 wrapper + index.ts 传参调整
- [x] D3 `npx tsc --noEmit` 快验

## Phase E：观察者 / 触发器 / 音频 / CSS（P3-4/9/13/10/8）

- [x] E1 三处 MutationObserver 加 30s 放弃上限
- [x] E2 TriggerManager 正则编译缓存（写操作失效）
- [x] E3 AudioEngine 事件多播（addTrackListener/addPlayStateListener + 退订），MiniPlayer/index.ts 改订阅制，删除单槽属性
- [x] E4 playBGM 播放列表去重 + refreshMediaGrid 签名守卫
- [x] E5 徽章五色收进 `.st-bgloader-panel` 自定义属性
- [x] E6 `npx tsc --noEmit` 快验

## Phase F：spec 教训与回归

- [x] F1 新增 `.trellis/spec/guides/trellis-shell-discipline.md`（自包含）+ guides/index.md 加行
- [x] F2 全量回归：build + e2e 24/24 + stress 4/4×2 + authority 18/18 + CSS 门禁 0
- [x] F3 Dev 冒烟探针（用后即删）：抽屉/切背景/迷你播放器 + pulse+视差分离证据 + 深合并预置存档验证
- [x] F4 任务 research/deliverables 记录 12 项实施说明（含 P3-10 内联样式保持 open）
- [ ] F5 提交推送 origin master + 归档任务

## 验证命令

```bash
npm run type-check && npm run build
TEST_TARGET_URL=https://127.0.0.1:8003 npm run test:e2e   # 24 项
node tests/stress.mjs                                      # 4 项 ×2
node tests/authority.mjs                                   # 真后端 18 项
grep '^\.' src/ui/style.css | grep -vc 'st-bg'             # 必须为 0
```

## 回滚点

每批一个逻辑提交组；任一批回归失败且无法快速定位 → revert 该批，对应 P3 项退回 open。
