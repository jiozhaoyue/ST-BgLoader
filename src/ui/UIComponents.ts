import { escapeHtml } from '../core/sanitize';

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
     * Renders a compact preset / dropdown row.
     */
    public static renderSelect(opts: SelectOptions): string {
        const optionsHtml = opts.options.map(o => {
            const sel = o.selected ? ' selected' : '';
            return `<option value="${escapeHtml(o.value)}"${sel}>${escapeHtml(o.label)}</option>`;
        }).join('');

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
     */
    public static bindRafSlider(
        container: HTMLElement,
        id: string,
        valId: string,
        unit: string,
        onChange: (v: number) => void
    ): void {
        const input = container.querySelector<HTMLInputElement>(`#${id}`);
        const label = container.querySelector<HTMLElement>(`#${valId}`);
        if (!input) return;

        let rafId: number | null = null;
        let pendingValue: number | null = null;

        input.addEventListener('input', () => {
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
        });
    }
}
