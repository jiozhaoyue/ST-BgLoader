# Implement：面板 UI 四面重构（11-19-panel-ui-refactor）

> 执行纪律：G-03 实时勾选；G-09 块级编辑；G-10 显式 pathspec；每阶段过门才进下一阶段。

## 阶段计划

### S1 基建层（样式拆分 + 语义层 + 工厂强化）
- [x] styles/00-tokens.css ~ 07-responsive.css 七件落盘；style.css 改聚合入口
- [x] 语义变量层 + z-index 分档 + fallback 统一（PRD 验收 8）
- [x] UIComponents：renderRow/renderGroup/renderSegmented/renderToolbar 新增；bindRafSlider 可解绑
- [x] 门：type-check + check:css 绿；截图（预览台）视觉无回归

### S2 顶栏抽屉信息架构（媒体 Tab）
- [x] 工具条分段胶囊 + 排序 + 搜索 + 上传
- [x] 场景条入媒体 Tab（快切下拉+应用/保存/删除+导入导出图标钮）
- [x] 网格：悬停信息条 + 懒挂载 + content-visibility + 抽帧联动
- [x] 多选模式 + 批量删/批量换 + 弹窗适配器接入
- [x] 门：type-check + check:css + dev-harness 绿

### S3 顶栏抽屉信息架构（设置 Tab 五组）
- [x] 五组折叠 + 记忆（localStorage）+ 默认开闭
- [x] 全部控件迁 renderRow/renderSelect/renderButton（工厂接入率 100%）
- [x] 触发器列表+行内开关改造；BGM/轮播折叠呈现
- [ ] 门：type-check + check:css + api-harness 绿（设置收敛路径不回归）

### S4 合规四面修（SettingsDrawer/MiniPlayer/装饰/文案/a11y/Popup）
- [x] SettingsDrawer 行式重排；MiniPlayer 语义变量+z-index 分档；原生装饰接 token
- [x] 6+ 处原生弹窗全部迁移（HostBridge.confirmDialog）
- [x] a11y 三处；文案全量清理
- [x] 门：grep 门禁（PRD 硬门 4/5/7/9/10）全过

### S5 移动端 + 性能 + 验收
- [x] 07-responsive：1000/450 断点 + 全屏接管 + 触摸 36px
- [ ] 性能：首渲 <50ms e2e 断言 + 300 卡窗口化断言
- [ ] 新增用例：移动断点/Popup 替换/多选批量/折叠记忆
- [ ] 全量回归：dev-harness + api-harness + Dev ST e2e + Dev Luker e2e（身份核验）
- [ ] 探针+截图双轨（≥9 视角）；分阶段提交推送

## 进度日志

- 2026-11-19：任务立项。基线存证：type-check ✓ / check:css ✓（0 泄漏 0 缺前缀 0 阴影）。Dev Luker :8003 已启动（junction 身份核验 exportScenes×3）。10×4 问答 40 项定案。蜂群 4/5 回报。
- 2026-11-19：S1 完成——styles/ 七件拆分+语义层+工厂强化+css-gate 多文件扫描；type-check/check:css/build 全绿（dist style.css 16.90 kB / index.js 251.62 kB）。
- 2026-11-19：S2+S3 完成——增强式内嵌（mount 不再隐藏原生）/分段胶囊/场景双下拉/五组折叠+记忆/多选批量（删/顺换/随机换）/懒挂载+content-visibility；dev-harness 14/14 + api-harness 38/38。
- 2026-11-19：S4 完成——HostBridge 弹窗适配器（callGenericPopup 优先+降级）替换全部 7 处原生弹窗；a11y 三处；MiniPlayer aria+z-index 分档；smoke-ui/extreme-media 适配分段胶囊语义（html/svg 归并 doc 段）。
- 2026-11-19：P0 整改完成（并行蜂群）——gitignore 三条、.bak 出索引、wiki 去 file:/// 本机路径、git 历史清理后 blob 8d2be5e0 已不可达；溢出修复完成（02-topbar-drawer.css 工具条 wrap，G-17 实测 overflowPx=0）。

## 验证命令清单

```bash
npm run type-check && npm run build && npm run check:css
node tests/dev-harness.mjs   # 免实例
node tests/api-harness.mjs   # 免实例
# 真机：TEST_TARGET_URL=http://127.0.0.1:8001 node tests/e2e.mjs（身份核验先行）
# 8003: https + 自签证书，按既有 e2e 配置
grep -c 'box-shadow:' src/ui/styles/*.css          # 须 0
grep '^\.' src/ui/styles/*.css | grep -vc 'st-bg'  # 须 0
grep -c '@media' src/ui/styles/*.css               # 须 ≥2
grep -rn "alert(\|confirm(\|prompt(" src/ui/       # 须 0
```
