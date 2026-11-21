// =============================================================================
// template-source — UI 模板单一来源 / dev 骨架锚点守卫（零依赖，Node 原生）
// -----------------------------------------------------------------------------
// 语义（规则真源：调研报告 pack-transfer-rescan-2026-11-21.md 第二章 C3 / G4，
// 第五章 web 工作台段「dev/index.html:7 为开发预览台」+ 第七章 17 条）：
//   本仓 UI 模板唯一来源是 src/ui/*.ts 的 innerHTML 字符串模板（单一模板源）。
//   dev/index.html 只是开发预览台骨架，仅允许放：
//     ① 预览台自有外壳（header/main/card/按钮等 st-bgloader-dev-* 类）；
//     ② 四个宿主挂载锚点白名单（插件运行时据此挂载面板）。
//   骨架严禁出现业务 UI 结构（如 st-bgloader-topbar-panel / 媒体网格卡片 /
//   st_bgloader_settings 面板本体），否则形成"模板双来源"漂移。
// 锚点白名单（调研报告 G4 已核：dev 已补齐三处 + index.html:46 的 bg_menu_content）：
//   #extensions_settings / #Backgrounds / #bg_menu_content / #backgrounds-drawer-toggle
// 判定：
//   1) 白名单锚点缺失 → 违例（宿主契约漂移）；
//   2) 骨架内出现业务模板标志类 → 违例（模板双来源）；
//   3) 骨架里含 <script type="module"> 之外的外链 script/link → 违例（G-13 零 CDN）。
// 用法：
//   node scripts/guards/template-source.mjs          真实扫描
//   node scripts/guards/template-source.mjs --self-test   E4 负例自测
// =============================================================================

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SKELETON_REL = join('dev', 'index.html');

// 宿主挂载锚点白名单：必须全部存在于骨架中（单一模板源挂载契约）。
const REQUIRED_ANCHORS = ['extensions_settings', 'Backgrounds', 'bg_menu_content', 'backgrounds-drawer-toggle'];

// 业务模板标志类：这些类的本体应由 src/ui/*.ts 运行时生成，不得写死在骨架。
const BIZ_TEMPLATE_MARKERS = [
    'st-bgloader-topbar-panel',
    'st-bgloader-media-card',
    'st-bgloader-group-head',
    'st-bgloader-card-info',
    'st-bg-mini-capsule',
];

// 外链资源检测：script/link 的 src/href 必须是本地相对路径（./ 或 /），禁 http(s)/协议相对。
const REMOTE_RE = /(?:src|href)\s*=\s*["'](?:https?:)?\/\/[^"']+["']/i;

function checkHtml(html) {
    const violations = [];
    // 规则 1：白名单锚点齐全
    for (const id of REQUIRED_ANCHORS) {
        const re = new RegExp(`id=["']${id}["']`);
        if (!re.test(html)) violations.push(`缺少宿主挂载锚点 #${id}`);
    }
    // 规则 2：业务模板标志类不得写死在骨架（模板双来源）
    for (const cls of BIZ_TEMPLATE_MARKERS) {
        if (html.includes(cls)) violations.push(`骨架出现业务模板标志类 .${cls}（应由 src/ui 运行时生成）`);
    }
    // 规则 3：零外链资源（G-13）
    html.split('\n').forEach((line, idx) => {
        if (REMOTE_RE.test(line)) violations.push(`L${idx + 1} 外链资源引用（G-13 零 CDN）: \`${line.trim()}\``);
    });
    return violations;
}

function scan(verbose = true) {
    const violations = [];
    const file = join(root, SKELETON_REL);
    if (!existsSync(file)) {
        violations.push(`${SKELETON_REL.split('\\').join('/')} 骨架文件缺失`);
    } else {
        for (const v of checkHtml(readFileSync(file, 'utf8'))) {
            violations.push(`${SKELETON_REL.split('\\').join('/')} ${v}`);
        }
    }
    if (verbose) {
        if (violations.length) {
            console.error(`模板单一来源守卫未通过（${violations.length} 项）：`);
            for (const v of violations) console.error(`  - ${v}`);
        } else {
            console.log(`模板单一来源守卫通过：${SKELETON_REL.split('\\').join('/')} 四个锚点齐全 / 骨架无业务模板 / 零外链`);
        }
    }
    return violations;
}

// E4 负例自测：先证明能抓锚点缺失、双来源、外链三类违规。
function selfTest() {
    const good = `<div id="extensions_settings"></div><div id="Backgrounds"></div>
<div id="bg_menu_content"></div><button id="backgrounds-drawer-toggle"></button>`;
    const cases = [
        { name: '完整骨架零违规', html: good, want: 0 },
        { name: '抓锚点缺失', html: good.replace('id="Backgrounds"', 'id="other"'), want: 1 },
        { name: '抓业务模板双来源', html: good + '<div class="st-bgloader-topbar-panel"></div>', want: 1 },
        { name: '抓外链 CDN', html: good + '<script src="https://cdn.example.com/x.js"></script>', want: 1 },
        { name: '本地相对脚本放行', html: good + '<script src="./boot.ts"></script>', want: 0 },
        { name: '多违例累加', html: '<div></div><script src="https://x/y.js"></script>', want: 5 },
    ];
    let pass = 0;
    for (const c of cases) {
        const got = checkHtml(c.html).length;
        const ok = got === c.want;
        console.log(`  ${ok ? '通过' : '失败'}：${c.name}（期望 ${c.want}，实得 ${got}）`);
        if (ok) pass++;
    }
    const allOk = pass === cases.length;
    console.log(allOk
        ? `E4 负例自测通过：${pass}/${cases.length} 用例命中预期，守卫具备抓模板漂移的能力`
        : 'E4 负例自测失败：判定与预期不符');
    return allOk ? 0 : 1;
}

const arg = process.argv[2];
if (arg === '--self-test') process.exit(selfTest());
const vs = scan();
process.exit(vs.length ? 1 : 0);
