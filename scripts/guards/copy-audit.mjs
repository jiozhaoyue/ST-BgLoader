// =============================================================================
// copy-audit — UI 文案静态审计守卫（零依赖，Node 原生）
// -----------------------------------------------------------------------------
// 语义（规则真源：AGENTS.md G-16「UI 文案短；禁长句、合并连词、分隔符、括号说明」
// + tests/verify-ui-compact.mjs:111-138,177-230 运行期断言 + 调研报告 C4）：
//   用户可见文案必须短、面向动作。禁止：
//     ① 合并连词「与」（文案里用「和」或分句；技术注释/日志前缀不算）；
//     ② 括号说明（(...) （...） 出现在文案正文）；
//     ③ 斜杠分隔符（' / ' 或 '／' 合并两个概念）；
//     ④ 超长句（标签内纯中文文案 > MAX_CN_LEN 字，阈值按 G-16 收紧）。
// 审计对象：src/ui/*.ts 里 innerHTML 模板标签之间的文本节点 + 单双引号内的中文文案。
// 排除：console/日志（[ST-BgLoader] 前缀）、CSS 类名、正则、注释、报错里的
//   动态插值、含 escapeHtml/${...} 的拼接片段（非纯静态短文案）。
// 用法：
//   node scripts/guards/copy-audit.mjs          真实扫描
//   node scripts/guards/copy-audit.mjs --self-test   E4 负例自测
// =============================================================================

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const uiDir = join(root, 'src', 'ui');
const MAX_CN_LEN = 12; // G-16：UI 短文案上限（纯中文标签文本）

function walk(dir, acc = []) {
    if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return acc;
    for (const name of readdirSync(dir)) {
        if (!/\.ts$/i.test(name)) continue;
        acc.push(join(dir, name));
    }
    return acc;
}

// 提取候选文案片段：HTML 标签之间的文本（>文本<）与引号内纯中文字符串。
// 返回 [{line, text}]，text 为待审文案。
function extractCopy(text) {
    const out = [];
    text.split('\n').forEach((raw, idx) => {
        // 剥行注释
        const line = raw.replace(/(^|[^:])\/\/.*$/, '$1');
        if (/console\.|\bthrow\b|\[ST-BgLoader\]/.test(line)) return; // 日志/报错不审

        // HTML 标签之间的中文文本：>中文<
        const tagTextRe = />\s*([^<>{}]*[\u4e00-\u9fff][^<>{}]*?)\s*</g;
        let m;
        while ((m = tagTextRe.exec(line)) !== null) {
            const t = m[1].trim();
            if (t) out.push({ line: idx + 1, text: t });
        }
        // 引号内的中文字符串字面量（用于 placeholder/title/label 属性值）
        const strRe = /['"]([^'"`]*[\u4e00-\u9fff][^'"`]*)['"]/g;
        while ((m = strRe.exec(line)) !== null) {
            let t = m[1].trim();
            // 排除含插值、HTML 片段、CSS 类、正则、路径的伪文案
            if (!t || /\$\{|<|>|\\|\/|\.css|\.ts|fa-|=/.test(t)) continue;
            out.push({ line: idx + 1, text: t });
        }
    });
    return out;
}

// 对单条文案判定违规原因，无违规返回 null。
function checkCopy(item) {
    const t = item.text;
    if (/与/.test(t)) return `合并连词「与」`;
    if (/[（(][^）)]*[）)]/.test(t)) return '括号说明';
    if (/\s\/\s|／/.test(t)) return '斜杠分隔符';
    const cn = (t.match(/[\u4e00-\u9fff]/g) ?? []).length;
    if (cn > MAX_CN_LEN) return `超长句（纯中文 ${cn} 字 > ${MAX_CN_LEN}）`;
    return null;
}

function scan(verbose = true) {
    const violations = [];
    for (const file of walk(uiDir)) {
        const rel = relative(root, file).split(sep).join('/');
        const src = readFileSync(file, 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')); // 块注释保行号剥离
        for (const item of extractCopy(src)) {
            const reason = checkCopy(item);
            if (reason) violations.push(`${rel}:${item.line} ${reason}: \`${item.text}\``);
        }
    }
    if (verbose) {
        if (violations.length) {
            console.error(`UI 文案审计未通过（${violations.length} 项）：`);
            for (const v of violations) console.error(`  - ${v}`);
        } else {
            console.log(`UI 文案审计通过：0 长句 / 0 括号说明 / 0 合并连词 / 0 分隔符（阈值 ${MAX_CN_LEN} 字）`);
        }
    }
    return violations;
}

// E4 负例自测：先证明能抓四类文案违规，再信真实 0 读数。
function selfTest() {
    const cases = [
        { name: '抓合并连词与', text: '播放与暂停', want: true },
        { name: '抓括号说明', text: '点击这里（推荐）', want: true },
        { name: '抓斜杠分隔符', text: '视频 / 音频', want: true },
        { name: '抓超长句', text: '这是一个非常非常长的说明文案超过阈值', want: true },
        { name: '放行短句', text: '播放', want: false },
        { name: '放行冒号提示', text: '导入失败：格式错误', want: false },
        { name: '放行含插值的动态片段', text: '删除 ${escapeHtml(item.name)}', want: false },
    ];
    let pass = 0;
    for (const c of cases) {
        // 走完整链路：先从包裹的 HTML 模板抽取，再逐条判定。
        const copies = extractCopy(`<span>${c.text}</span>`);
        const bad = copies.some((i) => checkCopy(i) !== null);
        const ok = bad === c.want;
        console.log(`  ${ok ? '通过' : '失败'}：${c.name}（期望违规=${c.want}，实得=${bad}）`);
        if (ok) pass++;
    }
    // 额外证明 extractCopy 能从模板抽取标签间中文文案
    const extracted = extractCopy('<div>播放与暂停</div>').some((i) => i.text.includes('与'));
    console.log(`  ${extracted ? '通过' : '失败'}：能从 HTML 模板抽取标签间文案`);
    const allOk = pass === cases.length && extracted;
    console.log(allOk
        ? `E4 负例自测通过：${pass}/${cases.length} 用例 + 抽取器命中预期`
        : 'E4 负例自测失败：判定与预期不符');
    return allOk ? 0 : 1;
}

const arg = process.argv[2];
if (arg === '--self-test') process.exit(selfTest());
const vs = scan();
process.exit(vs.length ? 1 : 0);
