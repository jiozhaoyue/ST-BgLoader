/**
 * 示范迁移组件：分段胶囊（Segmented）
 *
 * 选取理由：这是 UIComponents 中最小的纯展示组件——无 raw HTML 注入、
 * 无自带事件（交互由 bindSegmented 容器委托负责）、无状态、无 localStorage。
 * 用它做 Preact 首秀，DOM 结构与旧字符串模板逐字段等价，可随时回退，
 * 风险最低。其余控制器（抽屉、播放器、FX 等）留待后续波次迁移。
 *
 * 纪律：
 * - class 前缀保持 st-bgloader-*，宿主 jQuery 与 E2E 选择器零改动。
 * - 令牌只用 --st-bg-*（本组件不写内联颜色，样式全部来自既有 CSS）。
 * - 文本交给 Preact 自动转义，等价于旧版 escapeHtml，杜绝 XSS 回归。
 */
import { h } from './bridge';
import type { VNode } from './bridge';
import type { SegmentedOptions } from '../UIComponents';

/** 用 Preact h() 构造分段胶囊 vnode（不使用 JSX：tsconfig 未开 jsx 选项）。 */
export function segmentedVNode(opts: SegmentedOptions): VNode {
    const children = opts.options.map((o) => {
        const icon = o.icon ? h('i', { class: `fa-solid ${o.icon}` }) : null;
        return h(
            'button',
            {
                type: 'button',
                class: `st-bgloader-seg-btn${o.selected ? ' active' : ''}`,
                'data-seg-value': o.value,
            },
            icon,
            h('span', null, o.label)
        );
    });

    const props: Record<string, unknown> = { class: 'st-bgloader-seg' };
    if (opts.id) props.id = opts.id;

    return h('div', props, ...children);
}
