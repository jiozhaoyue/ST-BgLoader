// =============================================================================
// check-ui-tokens — 宿主主题令牌单一真源守卫（零依赖，Node 原生）
// -----------------------------------------------------------------------------
// 语义（规则真源：src/ui/styles/00-tokens.css:5-6 声明 + AGENTS.md 项目覆盖
// 「样式单一书写点」+ 调研报告 pack-transfer-rescan-2026-11-21.md 第二章 C2）：
//   --SmartTheme* 由宿主注入，是全仓主题色的唯一来源；只允许在
//   src/ui/styles/00-tokens.css 中被引用（派生出 --st-bg-* 语义变量）。
//   组件样式与 TS 注入面一律只引 --st-bg-*，直接引用 --SmartTheme* 即违规。
// 扫描范围：src/** 下所有 .ts/.css/.js/.mjs 源文件。
// 注释豁免：块注释 /* */ 与行注释 // 里的 --SmartTheme* 不算引用（说明性文字）。
//   —— 这样 FrostedGlassController.ts:42 的英文注释不会误报，真实声明仍被抓出。
// 用法：
//   node scripts/guards/check-ui-tokens.mjs          真实扫描，违例非零退出
//   node scripts/guards/check-ui-tokens.mjs --self-test   E4 负例自测，先证能抓违规
// =============================================================================

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ALLOWED_REL = join('src', 'ui', 'styles', '00-tokens.css');
const TOKEN_RE = /--SmartTheme[A-Za-z0-9_-]*/g;

// 剥注释但保留行号与字符位置：块注释内容替换为等长空白，行注释逐行截断。
// 行注释正则要求 // 前不是冒号，避免误伤 http:// 一类字符串。
function stripComments(text) {
    let out = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
    out = out.split('\n').map((line) => line.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n');
    return out;
}

// 在一段已剥注释的源码中查找 --SmartTheme* 引用，返回带行号的命中列表。
function findRefs(text) {
    const hits = [];
    text.split('\n').forEach((line, idx) => {
        TOKEN_RE.lastIndex = 0;
        let m;
        while ((m = TOKEN_RE.exec(line)) !== null) {
            hits.push({ line: idx + 1, token: m[0], col: m.index });
        }
    });
    return hits;
}

function walk(dir, acc = []) {
    if (!existsSync(dir)) return acc;
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        const st = statSyncSafe(p);
        if (!st) continue;
        if (st.isDirectory()) walk(p, acc);
        else if (/\.(ts|css|js|mjs)$/i.test(name)) acc.push(p);
    }
    return acc;
}

// 同步 stat 的轻量包装，失败返回 null（不存在或权限问题时跳过）。
function statSyncSafe(p) {
    try { return statSync(p); } catch { return null; }
}

function scan(verbose = true) {
    const violations = [];
    for (const file of walk(join(root, 'src'))) {
        const rel = relative(root, file).split(sep).join('/');
        if (rel === ALLOWED_REL.split(sep).join('/')) continue; // 唯一真源放行
        const hits = findRefs(stripComments(readFileSync(file, 'utf8')));
        for (const h of hits) {
            violations.push(`${rel}:${h.line} 违例直接引用 ${h.token}（仅允许 00-tokens.css）`);
        }
    }
    if (verbose) {
        if (violations.length) {
            console.error(`UI 令牌门禁未通过（${violations.length} 项）：`);
            for (const v of violations) console.error(`  - ${v}`);
        } else {
            console.log('UI 令牌门禁通过：src/** 中 --SmartTheme* 仅在 00-tokens.css 引用，组件注入面 0 违例');
        }
    }
    return violations;
}

// E4 负例自测：先证明守卫能抓违规，再信真实 0 读数的可信度。
function selfTest() {
    const cases = [
        {
            name: '能抓 CSS 声明里的 --SmartTheme 引用',
            src: '.x { color: var(--SmartThemeBodyColor, red); }',
            want: 1,
        },
        {
            name: '能抓 TS 模板字符串注入面里的 --SmartTheme 引用',
            src: 'style.textContent = `a{border:var(--SmartThemeBorderColor,transparent)}`;',
            want: 1,
        },
        {
            name: '一行两处引用都能抓',
            src: 'background:var(--SmartThemeBlurTintColor);color:var(--SmartThemeQuoteColor);',
            want: 2,
        },
        {
            name: '仅引语义令牌 --st-bg-* 不误报',
            src: '.x { color: var(--st-bg-text); border: 1px solid var(--st-bg-border); }',
            want: 0,
        },
        {
            name: '块注释与行注释里的 --SmartTheme* 豁免',
            src: '/* --SmartThemeBodyColor 说明 */\nconst x=1; // --SmartThemeBorderColor',
            want: 0,
        },
    ];
    let pass = 0;
    for (const c of cases) {
        const got = findRefs(stripComments(c.src)).length;
        const ok = got === c.want;
        console.log(`  ${ok ? '通过' : '失败'}：${c.name}（期望 ${c.want}，实得 ${got}）`);
        if (ok) pass++;
    }
    // 额外证明「允许文件」判定：00-tokens.css 路径会被 scan 放行
    const allowedOk = ALLOWED_REL.split(sep).join('/') === 'src/ui/styles/00-tokens.css';
    console.log(`  ${allowedOk ? '通过' : '失败'}：唯一真源路径白名单匹配 00-tokens.css`);
    const allOk = pass === cases.length && allowedOk;
    console.log(allOk
        ? `E4 负例自测通过：${pass}/${cases.length} 用例命中预期，守卫具备抓违例能力`
        : 'E4 负例自测失败：守卫判定与预期不符');
    return allOk ? 0 : 1;
}

const arg = process.argv[2];
if (arg === '--self-test') {
    process.exit(selfTest());
}
const vs = scan();
process.exit(vs.length ? 1 : 0);
