# 实例测试运维契约（启动 · 清理 · 扩展分发）

> 本页自包含（L0-17）：不引用任务目录。证据为 2026-10-31 夜间批（任务 10-31-overnight-feature-ui-batch）
> 现场实测，三次事故均在同一晚复现并修复。

## 1. 实例启动：必须 chdir，禁止裸绝对路径执行（MUST）

SillyTavern 系宿主（ST / Luker）的 `server.js` 以 `./config.yaml` **相对 cwd** 解析配置：

- 从仓库根裸跑 `node D:/.../Instance/Dev/SillyTavern/server.js` ⇒ 在**调用方目录**新建一份默认
  `config.yaml`（实测发生在 ST-BgLoader 仓根，L0-16 的 8000 出厂默认形态）；
- 正确姿势（ESM `import('./server.js')` 相对 eval 上下文解析，裸相对路径也会失败）：

```bash
node -e "process.chdir('<实例目录>'); import('file:///<实例目录>/server.js').catch(e => { console.error('boot failed:', e); process.exit(1); })"
```

违反后果：宿主按默认配置起在错误端口/数据区，或因端口占用启动中止；调用方目录被写入垃圾 config.yaml。

## 2. 进程清理：TaskStop 不收割宿主子进程树（MUST）

后台任务停止（宿主 TaskStop / kill 包装进程）后，`node server.js` 的**子进程存活**且可能**延迟重绑端口**
（实测同一晚三次：8001×2、8003×1，其中一次创建时间早于"已确认全空闲"的检查点）。

- 唯一可靠清理：**按端口查 PID 清杀 + 复查**：
  `netstat -ano | grep ":<port>" | grep LISTENING` → `taskkill //PID <pid> //F` → 再 netstat 确认；
- "任务已 killed" 或单次 netstat 为空 **不构成**清理完成的证据；
- 测试会话结束前，对 8001–8004 全段做一次终态确认。

违反后果：孤儿实例占住端口 ⇒ 下次启动报 "already in use"；更糟的是 **E2E 可能打到身份不明的孤儿**
（P-11 的变体：本次实测 e2e 连上过一个非本次启动的 8001 监听者）。

## 3. 扩展分发：third-party 扫描按"含 manifest.json 的子目录"判定（MUST）

- `Instance/Dev/SillyTavern/public/scripts/extensions/third-party/` 下的**每一个含 manifest.json 的
  子目录**都会被宿主当作独立扩展加载——**改名保留的旧拷贝**（如 `ST-BgLoader.stale-20261031`）
  同样会被加载 ⇒ 扩展双实例 ⇒ 双 fx 画布/双事件源，症状是**部分断言假失败**
  （实测 Test 15 `offHidden:false`：查询选择器命中第一个孤儿画布）；
- 淘汰旧拷贝必须**移出发现路径**（本仓约定：`Instance/Dev/_stale-extensions-backup/`），不能原地改名；
- Dev 实例的扩展分发形态用 **junction 指向工作区仓**（与 Dev Luker 既有形态一致，P-19 记载其存在）：
  `cmd /c mklink /J <third-party>/ST-BgLoader <工作区>/ST-BgLoader`——构建产物即改即生效，无拷贝漂移；
- junction 的**读穿**是分发机制本身；P-19 禁止的是把实例数据**写穿**进工作区仓，两者不矛盾——
  测试写入只走 `/api/backgrounds/*`（服务端数据目录），从不经过扩展目录。

## 4. 真机验证前必须核验"被测物身份"（MUST）

E2E 连上的端口 ≠ 意图中的实例：孤儿、双加载、陈旧拷贝都会让"绿"变成假证据
（本次夜间批 01:30 的 24/24 矩阵实际跑在 10-26 陈旧扩展上，junction 修复后才发现并复跑）。

- 跑套件前先核验被测扩展内容：`grep -c "<本批新增符号>" <实例扩展路径>/dist/index.js` 须 ≥1；
- 替换分发形态（拷贝↔junction）后的第一轮套件结果才算数。

## 5. 已知抖动形态（记录，不视为回归）

- `tests/authority.mjs` S7.3 在**紧随 extreme-media 的高负载**下可能误报
  （去抖写竞争的残余形态，9ad0bd3 已改基线对照+轮询；独立复跑即过，2026-10-31 实测 17/18→18/18）；
- `tests/e2e.mjs` Test 12 已在 ff6b823 去竞态（隔离播放列表 + 沉降 1200ms 隐藏定时器）；
  若再现顺序型抖动，优先怀疑**新增用例引入的异步副作用**而非产品代码。
