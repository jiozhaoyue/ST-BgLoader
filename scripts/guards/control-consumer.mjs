// =============================================================================
// control-consumer — 控件 id 消费者守卫（零依赖，Node 原生）
// -----------------------------------------------------------------------------
// 语义（规则真源：调研报告 pack-transfer-rescan-2026-11-21.md 第二章 C3）：
//   每个写进 DOM 的控件 id 都应有消费者（querySelector / getElementById /
//   addEventListener 绑定），杜绝"定义了却无人使用"的死控件与 id 漂移。
// 定义来源：
//   ① 静态字面量 id="xxx"（innerHTML 模板 / dev 骨架）——需显式消费；
//   ② el.id = 'xxx'（createElement 后赋值）——需显式消费；
//   ③ 组件实参 id: 'xxx'（renderButton/renderSlider/renderGroup 等）——由组件
//      框架通过参数或事件委托统一消费，豁免（否则会大量误报组件化控件）。
// 消费证据：
//   querySelector(All)('#xxx') / getElementById('xxx') / #前缀${动态} 拼接消费。
// 消费域：src/** 与 dev/** 全局（定义与消费可跨文件）。
// 用法：
//   node scripts/guards/control-consumer.mjs            真实扫描
//   node scripts/guards/control-consumer.mjs --dump     打印定义/消费/孤儿清单
//   node scripts/guards/control-consumer.mjs --self-test   E4 负例自测
// =============================================================================

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function walk(dir, acc = []) {
    if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return acc;
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        const st = statSync(p, { throwIfNoEntry: false });
        if (!st) continue;
        if (st.isDirectory()) walk(p, acc);       // 递归子目录（src/ui、src/bridge 等）
        else if (/\.(ts|html)$/i.test(name)) acc.push(p);
    }
    return acc;
}

// 只有"交互控件"的 id 才强制要求 JS 消费者；纯容器/style/SVG 资源由 CSS 或结构使用。
const INTERACTIVE_TAGS = new Set(['input', 'button', 'select', 'textarea', 'label', 'option']);

function collect() {
    const files = [...walk(join(root, 'src')), ...walk(join(root, 'dev'))];
    const staticDefs = [];   // {id, file, line, interactive}
    const componentDefs = new Set();
    const consumers = new Set();
    const dynamicPrefixes = new Set();

    for (const file of files) {
        const rel = relative(root, file).split(sep).join('/');
        const text = readFileSync(file, 'utf8');
        let m;

        // ① HTML 属性 id="xxx"：连同所在标签名一起捕获，判断是否交互控件。
        //    [^>]*? 保证不跨标签；tag 为最近 '<' 之后的标签名。
        const tagIdRe = /<([a-zA-Z][\w-]*)\b[^>]*?\bid\s*=\s*["']([A-Za-z][A-Za-z0-9_-]*)["']/g;
        while ((m = tagIdRe.exec(text)) !== null) {
            const line = text.slice(0, m.index).split('\n').length;
            const tagEnd = text.indexOf('>', m.index);
            const interactive = INTERACTIVE_TAGS.has(m[1].toLowerCase())
                || /role\s*=\s*["']button["']/.test(text.slice(m.index, tagEnd));
            staticDefs.push({ id: m[2], file: rel, line, interactive });
        }
        // ② DOM 赋值 el.id = 'xxx'：动态创建的元素，一律按控件要求消费。
        //    注意用 \.id 要求前有点号，排除 `const id = '...'` 变量赋值误匹配。
        const assignRe = /\.id\s*=\s*['"]([A-Za-z][A-Za-z0-9_-]*)['"]/g;
        while ((m = assignRe.exec(text)) !== null) {
            const line = text.slice(0, m.index).split('\n').length;
            staticDefs.push({ id: m[1], file: rel, line, interactive: true });
        }
        // ③ 组件实参 id: 'xxx'：组件框架统一消费，豁免。
        const compRe = /\bid:\s*['"]([A-Za-z][A-Za-z0-9_-]*)['"]/g;
        while ((m = compRe.exec(text)) !== null) componentDefs.add(m[1]);

        // 消费：querySelector(All)(...) 括号内所有 #id（支持 '#a, #b' 多选择器）
        const qsRe = /querySelector(?:All)?(?:<[^>]*>)?\(\s*(['"])([^)]*)\1\)/g;
        while ((m = qsRe.exec(text)) !== null) {
            const idRe = /#([A-Za-z][A-Za-z0-9_-]*)/g;
            let im;
            while ((im = idRe.exec(m[2])) !== null) consumers.add(im[1]);
        }
        const geRe = /getElementById\(\s*['"]([A-Za-z][A-Za-z0-9_-]*)['"]\s*\)/g;
        while ((m = geRe.exec(text)) !== null) consumers.add(m[1]);
        // 变量式消费 getElementById(id)：回溯 const/let/var id = 'xxx'
        const geVarRe = /getElementById\(\s*([A-Za-z_$][\w$]*)\s*\)/g;
        while ((m = geVarRe.exec(text)) !== null) {
            const varRe = new RegExp(`(?:const|let|var)\\s+${m[1]}\\s*=\\s*['"]([A-Za-z][A-Za-z0-9_-]*)['"]`);
            const found = text.match(varRe);
            if (found) consumers.add(found[1]);
        }
        // 动态前缀消费：'#前缀${...}'
        const dynRe = /['"`]#([A-Za-z][A-Za-z0-9_-]*)\$\{/g;
        while ((m = dynRe.exec(text)) !== null) dynamicPrefixes.add(m[1]);
        // SVG / CSS 资源引用 url(#xxx) 也算消费
        const urlRe = /url\(\s*['"]?#([A-Za-z][A-Za-z0-9_-]*)['"]?\s*\)/g;
        while ((m = urlRe.exec(text)) !== null) consumers.add(m[1]);
    }
    return { staticDefs, componentDefs, consumers, dynamicPrefixes };
}

function analyze(data) {
    const orphans = [];
    for (const def of data.staticDefs) {
        // 非交互容器（div/aside/style/SVG 等）由 CSS/结构或宿主使用，不强制 JS 消费者
        if (def.interactive === false) continue;
        // 组件实参集合里也出现的同名 id → 视为组件框架消费，豁免
        if (data.componentDefs.has(def.id)) continue;
        // 精确消费
        if (data.consumers.has(def.id)) continue;
        // 动态前缀消费
        if ([...data.dynamicPrefixes].some((p) => def.id.startsWith(p))) continue;
        orphans.push(def);
    }
    return orphans;
}

function scan(verbose = true, dump = false) {
    const data = collect();
    const orphans = analyze(data);
    if (dump) {
        console.log(`静态 id 定义 ${data.staticDefs.length} 个 / 组件实参 id ${data.componentDefs.size} 个 / 消费引用 ${data.consumers.size} 个 / 动态前缀 ${data.dynamicPrefixes.size} 个`);
        console.log('组件实参 id（豁免）:', [...data.componentDefs].sort().join(', '));
        console.log('动态前缀:', [...data.dynamicPrefixes].sort().join(', '));
        console.log('孤儿 id:', orphans.map((o) => `${o.file}:${o.line}#${o.id}`).join(', ') || '无');
    }
    const violations = orphans.map((o) => `${o.file}:${o.line} 控件 id #${o.id} 无消费者（querySelector/getElementById 均未引用）`);
    if (verbose) {
        if (violations.length) {
            console.error(`控件消费者守卫未通过（${violations.length} 项）：`);
            for (const v of violations) console.error(`  - ${v}`);
        } else {
            console.log(`控件消费者守卫通过：${data.staticDefs.length} 个静态 id 均有消费者（组件实参 id 由框架统一消费）`);
        }
    }
    return violations;
}

// E4 负例自测：用纯数据验证分析逻辑能抓孤儿、放行已消费/组件/动态前缀。
function selfTest() {
    const base = { componentDefs: new Set(), consumers: new Set(['st_ok']), dynamicPrefixes: new Set() };
    const cases = [
        {
            name: '抓无消费者的孤儿控件',
            data: { ...base, staticDefs: [{ id: 'st_orphan', file: 'x.ts', line: 1, interactive: true }] },
            want: 1,
        },
        {
            name: '放行有 querySelector 消费者的控件',
            data: { ...base, staticDefs: [{ id: 'st_ok', file: 'x.ts', line: 1, interactive: true }] },
            want: 0,
        },
        {
            name: '放行组件实参 id',
            data: { ...base, componentDefs: new Set(['st_comp']), staticDefs: [{ id: 'st_comp', file: 'x.ts', line: 1, interactive: true }] },
            want: 0,
        },
        {
            name: '放行动态前缀消费的 id',
            data: { ...base, dynamicPrefixes: new Set(['st_tab_']), staticDefs: [{ id: 'st_tab_library', file: 'x.ts', line: 1, interactive: true }] },
            want: 0,
        },
        {
            name: '非交互容器豁免',
            data: { ...base, staticDefs: [{ id: 'st_container', file: 'x.ts', line: 1, interactive: false }] },
            want: 0,
        },
        {
            name: '多孤儿累加',
            data: { ...base, staticDefs: [{ id: 'a', file: 'x.ts', line: 1, interactive: true }, { id: 'b', file: 'x.ts', line: 2, interactive: true }] },
            want: 2,
        },
    ];
    let pass = 0;
    for (const c of cases) {
        const got = analyze(c.data).length;
        const ok = got === c.want;
        console.log(`  ${ok ? '通过' : '失败'}：${c.name}（期望 ${c.want}，实得 ${got}）`);
        if (ok) pass++;
    }
    const allOk = pass === cases.length;
    console.log(allOk
        ? `E4 负例自测通过：${pass}/${cases.length} 用例命中预期，守卫具备抓孤儿控件的能力`
        : 'E4 负例自测失败：判定与预期不符');
    return allOk ? 0 : 1;
}

const arg = process.argv[2];
if (arg === '--self-test') process.exit(selfTest());
const vs = scan(true, arg === '--dump');
process.exit(vs.length ? 1 : 0);
