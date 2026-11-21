// =============================================================================
// qa-static — 静态守卫统一串跑入口（零依赖，Node 原生）
// -----------------------------------------------------------------------------
// 语义（规则真源：调研报告 pack-transfer-rescan-2026-11-21.md 第二章 C5/C6）：
//   建立固定顺序串行 + 非零中止的统一串跑入口，消除守卫散落与漏跑；
//   提供 --list / --only / --json 供 CI 与 agent 消费。
// 串跑清单（顺序固定，前序失败即中止，见 GUARDS）：
//   ui-tokens → dom-injection → template-source → control-consumer → copy-audit
// 退出码：全部通过 0；任一守卫失败 1；--only 名称不存在 2。
// 用法：
//   node scripts/guards/qa-static.mjs              串跑全部守卫
//   node scripts/guards/qa-static.mjs --list       列出守卫清单（JSON 数组名）
//   node scripts/guards/qa-static.mjs --only ui-tokens   只跑指定守卫
//   node scripts/guards/qa-static.mjs --json       以 JSON 输出各守卫结果
//   node scripts/guards/qa-static.mjs --self-test   E4 自测（验证注册表与 CLI 解析）
// =============================================================================

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// 守卫注册表：顺序即执行顺序，name 与 --only 参数对应。
const GUARDS = [
    { name: 'ui-tokens', file: 'check-ui-tokens.mjs', desc: '宿主主题令牌单一真源' },
    { name: 'dom-injection', file: 'dom-injection.mjs', desc: 'innerHTML 插值转义' },
    { name: 'template-source', file: 'template-source.mjs', desc: 'UI 模板单一来源' },
    { name: 'control-consumer', file: 'control-consumer.mjs', desc: '控件 id 消费者' },
    { name: 'copy-audit', file: 'copy-audit.mjs', desc: 'UI 文案审计' },
];

function parseArgs(argv) {
    const out = { list: false, json: false, only: null, selfTest: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--list') out.list = true;
        else if (a === '--json') out.json = true;
        else if (a === '--self-test') out.selfTest = true;
        else if (a === '--only') out.only = argv[++i] ?? null;
    }
    return out;
}

function runGuard(guard) {
    const r = spawnSync(process.execPath, [join(here, guard.file)], {
        encoding: 'utf8',
        timeout: 9000, // 单守卫 9 秒硬上限（全局前台 10 秒死线内）
    });
    const output = (r.stdout || '') + (r.stderr || '');
    return {
        name: guard.name,
        ok: r.status === 0 && !r.error && !r.timedOut,
        code: r.error ? -1 : r.status,
        timedOut: !!r.timedOut,
        output: output.trim(),
    };
}

function selfTest() {
    const cases = [
        { name: '--list 解析', argv: ['--list'], key: 'list', want: true },
        { name: '--json 解析', argv: ['--json'], key: 'json', want: true },
        { name: '--only 取值', argv: ['--only', 'ui-tokens'], key: 'only', want: 'ui-tokens' },
        { name: '--self-test 解析', argv: ['--self-test'], key: 'selfTest', want: true },
    ];
    let pass = 0;
    for (const c of cases) {
        const got = parseArgs(c.argv)[c.key];
        const ok = got === c.want;
        console.log(`  ${ok ? '通过' : '失败'}：${c.name}（期望 ${c.want}，实得 ${got}）`);
        if (ok) pass++;
    }
    const registryOk = GUARDS.length === 5 && GUARDS.every((g) => g.name && g.file && g.desc);
    console.log(`  ${registryOk ? '通过' : '失败'}：守卫注册表 5 项字段完整`);
    const allOk = pass === cases.length && registryOk;
    console.log(allOk
        ? `E4 自测通过：${pass}/${cases.length} 用例 + 注册表完整`
        : 'E4 自测失败：解析或注册表异常');
    return allOk ? 0 : 1;
}

const args = parseArgs(process.argv.slice(2));

if (args.selfTest) process.exit(selfTest());

if (args.list) {
    if (args.json) console.log(JSON.stringify(GUARDS.map((g) => g.name)));
    else GUARDS.forEach((g, i) => console.log(`${i + 1}. ${g.name} — ${g.desc} (${g.file})`));
    process.exit(0);
}

let targets = GUARDS;
if (args.only) {
    targets = GUARDS.filter((g) => g.name === args.only);
    if (targets.length === 0) {
        console.error(`未知守卫 --only ${args.only}，可用：${GUARDS.map((g) => g.name).join(', ')}`);
        process.exit(2);
    }
}

const results = [];
for (const g of targets) {
    const r = runGuard(g);
    results.push(r);
    if (!args.json) {
        console.log(`[${r.ok ? '通过' : '失败'}] ${g.name}`);
        if (!r.ok && r.output) console.log(r.output.split('\n').map((l) => `    ${l}`).join('\n'));
    }
    if (!r.ok) break; // 非零中止
}

if (args.json) {
    console.log(JSON.stringify({
        total: results.length,
        passed: results.filter((r) => r.ok).length,
        failed: results.filter((r) => !r.ok).length,
        allOk: results.every((r) => r.ok),
        results,
    }, null, 2));
}

const allOk = results.every((r) => r.ok) && results.length === targets.length;
if (!args.json) {
    console.log(allOk
        ? `静态守卫串跑全绿：${results.length}/${targets.length} 通过`
        : `静态守卫串跑失败：${results.filter((r) => !r.ok).length} 项未通过`);
}
process.exit(allOk ? 0 : 1);
