import { escapeHtml } from '../core/sanitize';
import { renderToHtml } from './framework/bridge';
import { segmentedVNode } from './framework/components';

export interface SliderOptions {
    id: string;
    valId: string;
    label: string;
    min: number;
    max: number;
    step: number;
    value: number;
    unit?: string;
}

export interface SelectOptionItem {
    value: string;
    label: string;
    selected?: boolean;
}

export interface SelectOptions {
    id: string;
    label: string;
    options: SelectOptionItem[];
    /** 紧凑模式：不带 preset-row 包裹与 label，用于工具条内联 */
    compact?: boolean;
    /** compact 模式下的 title 提示 */
    title?: string;
}

export interface CheckboxOptions {
    id: string;
    label: string;
    checked: boolean;
    sub?: boolean;
    bold?: boolean;
}

export interface ButtonOptions {
    id?: string;
    className?: string;
    icon?: string;
    label?: string;
    variant?: 'normal' | 'danger' | 'icon' | 'full';
    title?: string;
    disabled?: boolean;
}

export interface SectionOptions {
    id?: string;
    title: string;
    icon?: string;
    contentHtml: string;
    extraClass?: string;
}

export interface RowOptions {
    id?: string;
    label: string;
    icon?: string;
    /** 控件区 HTML（右侧），由调用方保证内容可信 */
    controlHtml: string;
}

export interface GroupOptions {
    /** 同时用作 localStorage 开闭记忆键 */
    id: string;
    title: string;
    icon?: string;
    /** 组头右侧动作区（按钮等）；点击该区不触发折叠 */
    actionsHtml?: string;
    contentHtml: string;
    /** 未有记忆时的初始开闭态 */
    open?: boolean;
}

export interface SegmentedOption {
    value: string;
    label: string;
    icon?: string;
    selected?: boolean;
}

export interface SegmentedOptions {
    id?: string;
    options: SegmentedOption[];
}

export class UIComponents {
    /**
     * Renders a compact, unified section card without redundant dividers.
     */
    public static renderSection(opts: SectionOptions): string {
        const idAttr = opts.id ? `id="${opts.id}"` : '';
        const iconHtml = opts.icon ? `<i class="fa-solid ${opts.icon}"></i> ` : '';
        const extraCls = opts.extraClass ? ` ${opts.extraClass}` : '';
        return `
            <div class="st-bgloader-section${extraCls}" ${idAttr}>
                <h4>${iconHtml}<span>${escapeHtml(opts.title)}</span></h4>
                ${opts.contentHtml}
            </div>
        `;
    }

    /**
     * Renders a compact slider row with label, input, and value readout.
     */
    public static renderSlider(opts: SliderOptions): string {
        const unit = opts.unit ?? '';
        return `
            <div class="st-bgloader-slider-row">
                <label for="${opts.id}">${escapeHtml(opts.label)}</label>
                <input type="range" id="${opts.id}" min="${opts.min}" max="${opts.max}" step="${opts.step}" value="${opts.value}" />
                <span class="st-bgloader-slider-val" id="${opts.valId}">${opts.value}${unit}</span>
            </div>
        `;
    }

    /**
     * Renders a compact preset / dropdown row. `compact` strips the wrapper
     * and label for inline toolbar use.
     */
    public static renderSelect(opts: SelectOptions): string {
        const optionsHtml = opts.options.map(o => {
            const sel = o.selected ? ' selected' : '';
            return `<option value="${escapeHtml(o.value)}"${sel}>${escapeHtml(o.label)}</option>`;
        }).join('');

        if (opts.compact) {
            const titleAttr = opts.title ? ` title="${escapeHtml(opts.title)}"` : '';
            return `<select id="${opts.id}" class="text_pole"${titleAttr}>${optionsHtml}</select>`;
        }

        return `
            <div class="st-bgloader-preset-row">
                <label for="${opts.id}">${escapeHtml(opts.label)}</label>
                <select id="${opts.id}" class="text_pole">
                    ${optionsHtml}
                </select>
            </div>
        `;
    }

    /**
     * Renders a compact checkbox item.
     */
    public static renderCheckbox(opts: CheckboxOptions): string {
        const subClass = opts.sub ? ' st-bgloader-check-sub' : '';
        const checkedAttr = opts.checked ? ' checked' : '';
        const labelText = opts.bold
            ? `<strong>${escapeHtml(opts.label)}</strong>`
            : escapeHtml(opts.label);

        return `
            <label class="st-bgloader-check${subClass}">
                <input type="checkbox" id="${opts.id}"${checkedAttr} />
                <span>${labelText}</span>
            </label>
        `;
    }

    /**
     * Renders a compact button.
     */
    public static renderButton(opts: ButtonOptions): string {
        const classes = ['menu_button'];
        if (opts.variant === 'danger') classes.push('menu_button_danger');
        if (opts.variant === 'icon') classes.push('menu_button_icon');
        if (opts.variant === 'full') classes.push('st-bgloader-btn-full');
        if (opts.disabled) classes.push('st-bgloader-disabled');
        if (opts.className) classes.push(opts.className);

        const idAttr = opts.id ? `id="${opts.id}"` : '';
        const titleAttr = opts.title ? `title="${escapeHtml(opts.title)}"` : '';
        const iconHtml = opts.icon ? `<i class="fa-solid ${opts.icon}"></i>` : '';
        const labelHtml = opts.label ? ` ${escapeHtml(opts.label)}` : '';

        return `<button type="button" ${idAttr} class="${classes.join(' ')}" ${titleAttr}>${iconHtml}${labelHtml}</button>`;
    }

    /**
     * Binds a range slider input with requestAnimationFrame (rAF) throttling.
     * Guarantees 60fps smoothness and prevents layout thrashing on high-frequency drag events.
     * @returns 解绑函数——重渲染前必须调用（绑定器可解绑定案 2026-11-19），取消挂起 rAF。
     */
    public static bindRafSlider(
        container: HTMLElement,
        id: string,
        valId: string,
        unit: string,
        onChange: (v: number) => void
    ): () => void {
        const input = container.querySelector<HTMLInputElement>(`#${id}`);
        const label = container.querySelector<HTMLElement>(`#${valId}`);
        if (!input) return () => {};

        let rafId: number | null = null;
        let pendingValue: number | null = null;

        const onInput = () => {
            const val = Number(input.value);
            if (label) label.textContent = `${val}${unit}`;
            pendingValue = val;

            if (rafId === null) {
                rafId = window.requestAnimationFrame(() => {
                    if (pendingValue !== null) {
                        onChange(pendingValue);
                    }
                    rafId = null;
                });
            }
        };

        input.addEventListener('input', onInput);
        return () => {
            input.removeEventListener('input', onInput);
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
                rafId = null;
            }
        };
    }

    /**
     * Renders a horizontal settings row: label left, control right.
     */
    public static renderRow(opts: RowOptions): string {
        const idAttr = opts.id ? ` id="${opts.id}"` : '';
        const iconHtml = opts.icon ? `<i class="fa-solid ${opts.icon}"></i>` : '';
        return `
            <div class="st-bgloader-row"${idAttr}>
                <label>${iconHtml}<span>${escapeHtml(opts.label)}</span></label>
                <div class="st-bgloader-row-control">${opts.controlHtml}</div>
            </div>
        `;
    }

    /**
     * Renders a collapsible group with persisted open/closed state.
     * 状态记忆走 localStorage（视图态），不进 settings（避免远程镜像噪音）。
     */
    public static renderGroup(opts: GroupOptions): string {
        const open = opts.open ?? false;
        const iconHtml = opts.icon ? `<i class="fa-solid ${opts.icon}"></i>` : '';
        return `
            <div class="st-bgloader-group" id="${escapeHtml(opts.id)}" data-open="${open}">
                <div class="st-bgloader-group-head" data-group-toggle="${escapeHtml(opts.id)}" tabindex="0" role="button" aria-expanded="${open}">
                    <span class="st-bgloader-group-title">${iconHtml}<span>${escapeHtml(opts.title)}</span></span>
                    <span class="st-bgloader-group-actions">${opts.actionsHtml ?? ''}</span>
                    <i class="fa-solid fa-circle-chevron-down st-bgloader-group-chevron"></i>
                </div>
                <div class="st-bgloader-group-body"${open ? '' : ' hidden'}>${opts.contentHtml}</div>
            </div>
        `;
    }

    /**
     * Renders a single-select segmented pill control.
     */
    public static renderSegmented(opts: SegmentedOptions): string {
        // Preact 示范迁移（框架基建兵首波次）：改用 Preact h() 构造胶囊 DOM，
        // 经桥接层序列化回字符串嵌入既有模板。class 前缀与 data-seg-value
        // 逐字段保持旧版一致，bindSegmented 事件委托与 E2E 选择器零改动。
        // 纯展示、无状态、无自带事件，故走静态渲染通道；交互仍由原委托负责。
        return renderToHtml(segmentedVNode(opts));
    }

    private static readonly GROUP_STATE_KEY = 'st_bgloader_group_state';

    /**
     * Binds collapsible groups inside `container`: applies persisted open/closed state
     * (falling back to `defaults`), then toggles on head clicks. Head action areas
     * (`.st-bgloader-group-actions`) never trigger folding.
     * @returns 解绑函数（重渲染前必须调用）。
     */
    public static bindGroups(
        container: HTMLElement,
        defaults: Record<string, boolean>
    ): () => void {
        let stored: Record<string, boolean> = {};
        try {
            stored = JSON.parse(localStorage.getItem(UIComponents.GROUP_STATE_KEY) ?? '{}') as Record<string, boolean>;
        } catch { stored = {}; }

        const applyState = () => {
            for (const group of Array.from(container.querySelectorAll<HTMLElement>('.st-bgloader-group'))) {
                const id = group.id;
                if (!id) continue;
                const open = stored[id] ?? defaults[id] ?? false;
                group.dataset.open = String(open);
                const body = group.querySelector<HTMLElement>(':scope > .st-bgloader-group-body');
                if (body) body.hidden = !open;
                const head = group.querySelector<HTMLElement>(':scope > .st-bgloader-group-head');
                if (head) head.setAttribute('aria-expanded', String(open));
            }
        };
        applyState();

        // 折叠切换公共逻辑：click 与键盘 Enter/Space 共用，避免重复（红队 P1-1）。
        const toggleHead = (head: HTMLElement) => {
            if (!container.contains(head)) return;
            const group = head.parentElement;
            const id = group?.id;
            if (!group || !id) return;
            const nowOpen = group.dataset.open !== 'true';
            group.dataset.open = String(nowOpen);
            const body = group.querySelector<HTMLElement>(':scope > .st-bgloader-group-body');
            if (body) body.hidden = !nowOpen;
            head.setAttribute('aria-expanded', String(nowOpen)); // aria 同步（红队 P1-1）
            stored[id] = nowOpen;
            try {
                localStorage.setItem(UIComponents.GROUP_STATE_KEY, JSON.stringify(stored));
            } catch { /* 写失败仅损失记忆，不影响功能 */ }
        };

        const onClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            const head = target?.closest<HTMLElement>('.st-bgloader-group-head');
            if (!head) return;
            if (target?.closest('.st-bgloader-group-actions')) return; // 动作区按钮不折叠
            toggleHead(head);
        };

        // 容器级键盘委托：组头 Enter/Space 触发折叠（a11y 定案键盘可达，红队 P1-1）。
        const onKeydown = (e: KeyboardEvent) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const target = e.target as HTMLElement | null;
            const head = target?.closest<HTMLElement>('.st-bgloader-group-head');
            if (!head || !container.contains(head)) return;
            if (target?.closest('.st-bgloader-group-actions')) return;
            e.preventDefault();
            toggleHead(head);
        };
        container.addEventListener('click', onClick);
        container.addEventListener('keydown', onKeydown);
        return () => {
            container.removeEventListener('click', onClick);
            container.removeEventListener('keydown', onKeydown);
        };
    }

    /**
     * Binds single-select behavior for all `.st-bgloader-seg` groups inside `container`.
     * @returns 解绑函数（重渲染前必须调用）。
     */
    public static bindSegmented(
        container: HTMLElement,
        onChange: (value: string) => void
    ): () => void {
        const onClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            const btn = target?.closest<HTMLElement>('.st-bgloader-seg-btn');
            if (!btn || !container.contains(btn)) return;
            const seg = btn.closest<HTMLElement>('.st-bgloader-seg');
            if (!seg) return;
            for (const b of Array.from(seg.querySelectorAll('.st-bgloader-seg-btn'))) {
                b.classList.toggle('active', b === btn);
            }
            onChange(btn.dataset.segValue ?? '');
        };
        container.addEventListener('click', onClick);
        return () => container.removeEventListener('click', onClick);
    }
}
