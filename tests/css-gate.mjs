// CSS 作用域门禁：对 src 源文件生效（dist 是压缩产物，按行首 grep 会被压缩形态骗过）。
// 规则依据 L1-MR-3 双前缀铁律：
//   1) 严禁全局选择器泄漏：* / html / body / :root 开头的选择器一律违规；
//   2) 每条选择器必须携带本扩展专属前缀：类 .st-bg-*（含 .st-bgloader-*）或 id #st_bg*；
//   3) 零溢光：box-shadow 一律禁止（用户裁定 2026-09-26，边界由边框+色调表达）。
// 用法：npm run check:css（退出码非 0 即违规，逐条列出 file:line 证据）。

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = join(root, 'src', 'ui', 'style.css');
const text = readFileSync(cssPath, 'utf8');

const violations = [];

// 单遍字符扫描：剥注释 + 括号深度跟踪 + 选择器缓冲（记录起始行号）
let line = 1;
let depth = 0;
let inComment = false;
let buf = '';
let bufLine = 0; // 选择器首个非空白字符所在行

const flushSelector = (endLine) => {
    const sel = buf.trim();
    const startLine = bufLine || endLine;
    buf = '';
    bufLine = 0;
    if (!sel || sel.startsWith('@')) return; // @media / @keyframes 前置声明不校验
    for (const part of sel.split(',')) {
        const s = part.trim();
        if (!s) continue;
        // keyframes 内部选择器（from / to / N%）豁免
        if (/^(from|to|-?\d+(\.\d+)?%)$/i.test(s)) continue;
        // 规则 1：全局选择器泄漏
        if (/^(\*|html|body|:root)\b/i.test(s)) {
            violations.push(`L${startLine} 全局选择器泄漏: \`${s}\``);
            continue;
        }
        // 规则 2：前缀纪律（类 .st-bg* / id #st_bg* 至少其一）
        const hasPrefix = /\.st-bg[A-Za-z0-9_-]*/.test(s) || /#st_bg[A-Za-z0-9_-]*/.test(s);
        if (!hasPrefix) {
            violations.push(`L${startLine} 缺少扩展前缀（需 .st-bg-* / #st_bg*）: \`${s}\``);
        }
    }
};

for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inComment) {
        if (ch === '*' && next === '/') {
            inComment = false;
            i++;
        }
        if (ch === '\n') line++;
        continue;
    }
    if (ch === '/' && next === '*') {
        inComment = true;
        i++;
        continue;
    }

    if (ch === '\n') {
        line++;
        continue;
    }
    if (ch === '{') {
        flushSelector(line);
        depth++;
        continue;
    }
    if (ch === '}') {
        depth = Math.max(0, depth - 1);
        buf = '';
        bufLine = 0;
        continue;
    }
    if (ch === ';') {
        // 声明区内的分号：清空缓冲，防止声明文本被误当作选择器
        buf = '';
        bufLine = 0;
        continue;
    }
    if (buf === '' && /\s/.test(ch)) continue; // 不记录缓冲起点前的空白
    if (buf === '') bufLine = line; // 选择器起始行
    buf += ch;
}
flushSelector(line);

// 规则 3：box-shadow 零容忍（注释已剥，按扫描行号无法回查，重扫一遍定位原始行）
const noComment = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')); // 保行号
noComment.split('\n').forEach((l, idx) => {
    if (/box-shadow/.test(l)) {
        violations.push(`L${idx + 1} 禁止 box-shadow（用户裁定零溢光）: \`${l.trim()}\``);
    }
});

if (violations.length > 0) {
    console.error(`CSS 门禁未通过（${violations.length} 项）：`);
    for (const v of violations) console.error(`  - ${v}`);
    process.exit(1);
}
console.log('CSS 门禁通过：0 全局泄漏 / 0 缺前缀 / 0 box-shadow（src/ui/style.css）');
