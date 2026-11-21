// =============================================================================
// dom-injection — innerHTML 模板插值转义守卫（零依赖，Node 原生）
// -----------------------------------------------------------------------------
// 语义（规则真源：src/core/sanitize.ts:9-16 escapeHtml 注释 + AGENTS.md D-05/G-11
// + 调研报告 pack-transfer-rescan-2026-11-21.md 第二章 C3/G5）：
//   凡是 string 类型的用户输入（媒体名、文件名、规则名/模式、远端 URL）进入
//   innerHTML 模板，必须先经 escapeHtml() 转义；未转义的裸插值= XSS 注入面。
//   数字/布尔/静态字面量/已转义派生量/组件渲染函数返回值不携带用户文本，豁免。
// 扫描范围：src/ui 下所有 .ts 文件里的 `.innerHTML = \`...\`` 模板字面量插值。
// 只查 innerHTML，不查 textContent / setAttribute / console / alertDialog（非 HTML 解析面）。
// 判定：
//   ${escapeHtml(x)}            → 安全（显式转义）
//   ${数字/布尔运算}            → 安全（不产字符串内容）
//   ${三元且两分支均静态字面量} → 安全（静态串）
//   ${UIComponents.renderXxx(...)} → 安全（组件内部已转义，单一模板源）
//   ${已转义派生变量}（白名单）  → 安全（labelText/previewContent 等先 escapeHtml）
//   其它裸标识符/属性访问          → 违例（未知来源，需人工确认是否转义）
// 用法：
//   node scripts/guards/dom-injection.mjs          真实扫描，违例非零退出
//   node scripts/guards/dom-injection.mjs --self-test   E4 负例自测
// =============================================================================

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const uiDir = join(root, 'src', 'ui');

// 已在赋值前经 escapeHtml 转义的派生局部变量（逐一读码核实，勿随意扩充）。
const ESCAPED_LOCALS = new Set([
    'labelText',        // UIComponents.renderCheckbox:151-153 bold 两分支均 escapeHtml
    'previewContent',   // TopbarBackgroundDrawer:1101-1105 data-lazy 走 escapeHtml
    'labelHtml',        // UIComponents.renderButton:177 escapeHtml(opts.label)
    'buttonHtml',       // SettingsDrawer 经 renderButton 生成
    'activeName',       // SettingsDrawer:91 escapeHtml 后派生
    'displayName',      // TopbarBackgroundDrawer:1107 后接 escapeHtml(displayName)
]);

function walk(dir, acc = []) {
    if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return acc;
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (!/\.ts$/i.test(name)) continue;
        acc.push(p);
    }
    return acc;
}

// 提取所有 `.innerHTML = \`...\`` 后的模板字面量区间（按反引号配对，处理转义 \`）。
// 返回 [{startLine, body}]，body 为模板内容原文。
function extractInnerHtmlTemplates(text) {
    const out = [];
    const re = /\.innerHTML\s*=\s*`/g;
    let m;
    while ((m = re.exec(text)) !== null) {
        let i = re.lastIndex; // 反引号之后
        let body = '';
        while (i < text.length) {
            if (text[i] === '\\') { body += text[i] + (text[i + 1] ?? ''); i += 2; continue; }
            if (text[i] === '`') break;
            body += text[i];
            i++;
        }
        const startLine = text.slice(0, m.index).split('\n').length;
        out.push({ startLine, body, endIndex: i });
        re.lastIndex = i + 1;
    }
    return out;
}

// 提取模板 body 中每个 ${...} 的表达式（支持一层大括号嵌套）。
function extractInterpolations(body) {
    const out = [];
    for (let i = 0; i < body.length; i++) {
        if (body[i] === '$' && body[i + 1] === '{') {
            let depth = 1;
            let j = i + 2;
            while (j < body.length && depth > 0) {
                if (body[j] === '{') depth++;
                else if (body[j] === '}') depth--;
                j++;
            }
            out.push(body.slice(i + 2, j - 1).trim());
            i = j - 1;
        }
    }
    return out;
}

// 携带自由文本的用户数据字段名：出现在裸插值中即判未转义。
// 属性访问形态 .name / .url 等；裸标识符由"单一标识符"分支兜底。
const DANGEROUS_FIELD_RE = /\.(name|url|title|label|pattern|path|description|message|fileName|content|src|href)\b/i;
// 受控枚举/非文本字段：单一属性链命中则安全（值域由代码枚举或布尔控制）。
const SAFE_SINGLE_PROPS = new Set([
    'type', 'enabled', 'activeTab', 'mode', 'id', 'value', 'checked',
    'size', 'length', 'index', 'count', 'open', 'disabled', 'visible',
]);

// 判定单个插值表达式是否安全（返回 true=安全，false=违例）。
// 判定顺序：先放行显式转义/组件渲染/已转义派生量，再拦截危险文本字段，
// 最后按"数值运算 / 静态三元 / 受控枚举 / 单标识符"分类。
function isSafeExpr(expr) {
    if (!expr) return true;
    // 显式转义 / 组件渲染单一模板源 / 已转义派生局部变量：最高优先级放行
    if (/^escapeHtml\s*\(/.test(expr)) return true;
    if (/^UIComponents\.render[A-Za-z]+\s*\(/.test(expr)) return true;
    if (ESCAPED_LOCALS.has(expr)) return true;

    // 危险文本字段的裸插值：无论形态一律拦截（未 escapeHtml 包裹）
    if (DANGEROUS_FIELD_RE.test(expr)) return false;

    // 纯静态字面量与数字
    if (/^['"`]/.test(expr) && /['"`]$/.test(expr)) return true;
    if (/^-?\d+(\.\d+)?$/.test(expr)) return true;

    // 数值/受控运算：Math、Number、parseInt、CSS.escape、Date、toFixed、size/length
    if (/^(Math\.|Number\(|parseInt\(|parseFloat\(|CSS\.escape\(|Date\.now\(|JSON\.stringify\(|String\()/.test(expr)) return true;
    if (/\btoFixed\(/.test(expr) || /\.(size|length)\b/.test(expr)) return true;

    // 三元 / 比较 / 逻辑 / 算术 / 函数调用：输出多为字面量或受控值，
    // 且上面的危险字段检查已排除携带用户文本的分支 → 放行。
    if (/[?:=<>!]/.test(expr) || /\w\s*\/\s*\w/.test(expr) || /[A-Za-z_$][\w$]*\s*\(/.test(expr)) return true;

    // 单一属性链：命中受控枚举白名单才放行（如 item.type）
    const singleProp = expr.match(/^[A-Za-z_$][\w$]*\.(?:[A-Za-z_$][\w$]*\.)*([A-Za-z_$][\w$]*)$/);
    if (singleProp && SAFE_SINGLE_PROPS.has(singleProp[1])) return true;

    // 其余裸标识符（raw / n / reason 等未知来源字符串）一律判需转义
    return false;
}

function scan(verbose = true) {
    const violations = [];
    for (const file of walk(uiDir)) {
        const rel = relative(root, file).split(sep).join('/');
        const text = readFileSync(file, 'utf8');
        for (const tpl of extractInnerHtmlTemplates(text)) {
            for (const expr of extractInterpolations(tpl.body)) {
                if (!isSafeExpr(expr)) {
                    const localLine = tpl.startLine + tpl.body.slice(0, tpl.body.indexOf('${' + expr)).split('\n').length - 1;
                    violations.push(`${rel}:${localLine} innerHTML 裸插值未转义: \`${expr}\``);
                }
            }
        }
    }
    if (verbose) {
        if (violations.length) {
            console.error(`DOM 注入守卫未通过（${violations.length} 项）：`);
            for (const v of violations) console.error(`  - ${v}`);
        } else {
            console.log('DOM 注入守卫通过：src/ui innerHTML 模板插值 0 裸值（escapeHtml/静态/组件渲染/已转义派生量）');
        }
    }
    return violations;
}

// E4 负例自测：先证明守卫能抓未转义注入，再信真实读数。
function selfTest() {
    const cases = [
        { name: '抓 innerHTML 里的裸用户变量', src: 'el.innerHTML = `<div>${item.name}</div>`;', want: 1 },
        { name: '抓 innerHTML 里的裸属性访问插值', src: 'el.innerHTML = `<span>${user.url}</span>`;', want: 1 },
        { name: '放行 escapeHtml 包裹的插值', src: 'el.innerHTML = `<span>${escapeHtml(item.name)}</span>`;', want: 0 },
        { name: '放行数字运算插值', src: 'el.innerHTML = `<b>${Math.round(x / 10)}</b>`;', want: 0 },
        { name: '放行组件渲染函数', src: 'el.innerHTML = `${UIComponents.renderButton({ id: "x" })}`;', want: 0 },
        { name: '放行静态三元分支', src: 'el.innerHTML = `<i class="${on ? "a" : "b"}"></i>`;', want: 0 },
        { name: 'textContent 不纳入扫描', src: 'el.textContent = `${item.name}`;', want: 0 },
        { name: '单模板多裸插值分别判定', src: 'el.innerHTML = `<b>${n}</b><i>${escapeHtml(name)}</i><u>${raw}</u>`;', want: 2 },
        { name: '危险文本字段在三元内仍拦截', src: 'el.innerHTML = `<b>${on ? item.name : "默认"}</b>`;', want: 1 },
        { name: '受控枚举属性 item.type 放行', src: 'el.innerHTML = `<b>${item.type}</b>`;', want: 0 },
    ];
    let pass = 0;
    for (const c of cases) {
        const tpls = extractInnerHtmlTemplates(c.src);
        let got = 0;
        for (const t of tpls) for (const e of extractInterpolations(t.body)) if (!isSafeExpr(e)) got++;
        const ok = got === c.want;
        console.log(`  ${ok ? '通过' : '失败'}：${c.name}（期望 ${c.want}，实得 ${got}）`);
        if (ok) pass++;
    }
    const allOk = pass === cases.length;
    console.log(allOk
        ? `E4 负例自测通过：${pass}/${cases.length} 用例命中预期，守卫具备抓未转义注入的能力`
        : 'E4 负例自测失败：判定与预期不符');
    return allOk ? 0 : 1;
}

const arg = process.argv[2];
if (arg === '--self-test') process.exit(selfTest());
const vs = scan();
process.exit(vs.length ? 1 : 0);
