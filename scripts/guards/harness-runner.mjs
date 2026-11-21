// =============================================================================
// harness 自包含运行器（零外部依赖，Node 原生）
// -----------------------------------------------------------------------------
// 背景：dev-harness / api-harness 设计上不自启服务器（docs/Dev-Guide.md:131），
//       门禁直接运行且 :5173 无服务时必现 net::ERR_CONNECTION_REFUSED。
// 语义：探测 :5173；无服务则拉起 dev:ui（vite.config.dev.ts）；等就绪后运行目标
//       harness 并透传输出与退出码；仅回收本运行器启动的服务进程树。
//       若 :5173 已有服务则复用，不重复启动、不误杀他人进程。
// 用法：
//   node scripts/guards/harness-runner.mjs tests/dev-harness.mjs
//   node scripts/guards/harness-runner.mjs tests/api-harness.mjs
// =============================================================================
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const TARGET_URL = process.env.HARNESS_URL || 'http://localhost:5173/';

const target = process.argv[2];
if (!target) {
    console.error('用法：node scripts/guards/harness-runner.mjs <harness 脚本路径>');
    process.exit(2);
}
const targetPath = join(root, target);

async function reachable() {
    try {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 1500);
        const res = await fetch(TARGET_URL, { signal: ctl.signal });
        clearTimeout(timer);
        return res.ok;
    } catch {
        return false;
    }
}

let server = null;
let serverLog = '';

function stopServer() {
    if (!server || server.pid == null) return;
    const pid = server.pid;
    server = null;
    try {
        if (process.platform === 'win32') {
            spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
        } else {
            process.kill(-pid, 'SIGTERM');
        }
    } catch { /* 服务已退出时忽略 */ }
}

process.on('exit', stopServer);

if (!(await reachable())) {
    server = spawn(process.execPath, [viteBin, '--config', 'vite.config.dev.ts'], {
        cwd: root,
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    server.stdout?.on('data', (d) => { serverLog += d.toString(); });
    server.stderr?.on('data', (d) => { serverLog += d.toString(); });

    const deadline = Date.now() + 20000;
    while (!(await reachable()) && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 300));
    }
    if (!(await reachable())) {
        console.error('dev:ui 预览服务启动失败，无法访问 ' + TARGET_URL);
        if (serverLog.trim()) console.error(serverLog.trim());
        stopServer();
        process.exit(1);
    }
}

const r = spawnSync(process.execPath, [targetPath], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, HARNESS_URL: TARGET_URL },
});
stopServer();
process.exit(r.status ?? 1);
