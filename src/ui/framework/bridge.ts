/**
 * Preact 框架桥接层（框架基建兵 · 迁移路线第一步）
 *
 * ⚠️ 预留 API，尚未接线；接线点 = 宿主抽屉关闭回调。
 * 本模块目前只有 renderToHtml 走通（迁移第一步），mount / mountWithListeners /
 * FrameworkHost / frameworkHost 等防泄漏设施尚无任何调用方，属于为第二、三步迁移
 * 预留的基础设施，生产代码尚未接入。防泄漏能力真正生效的落点是宿主抽屉关闭回调：
 * 待抽屉关闭路径调用 frameworkHost.unmountAll() 后，vnode 树与原生监听才会被一并清理。
 * 在此之前，勿据此声称已具备运行时清理能力（红队发现：防泄漏设施零调用方）。
 *
 * 背景与选型：主人已拍板引入框架。按 pack-transfer-rescan 报告第四章证据，
 * Preact 以 gzip 约 4.8KB、零运行时依赖、vite lib 可直接打包、渲染真实 DOM
 * 且共存风险最低胜出。宿主酒馆使用原生 DOM + jQuery 委托，插件面板以
 * innerHTML 字符串模板挂载，因此桥接层必须做到「渐进、可共存、可回退」。
 *
 * 共存纪律（不可逾越）：
 * 1. Preact 只接管本插件自有根节点（.st-bgloader-* / #st_bg*），
 *    绝不重建宿主原生抽屉，也不写 :root 全局。
 * 2. 组件样式只引 --st-bg-* 语义令牌，--SmartTheme* 仅限 00-tokens.css。
 * 3. 运行时零 CDN、零外链（G-13）；Preact 随 lib 产物一并打入，无外部引用。
 *
 * 迁移路线（三步走，逐步收敛）：
 * 第一步（本波次）：用 renderToHtml 把最小纯展示组件切到 Preact，
 *   序列化后仍嵌入原有 innerHTML 模板，行为零变化、可随时回退。
 * 第二步：把有状态的独立面板切到 mount()，由 Preact 接管声明式事件与更新。
 * 第三步：用 FrameworkHost 统一管理所有根节点生命周期，宿主抽屉关闭时
 *   调 unmountAll() 一次性清理 vnode 树与原生监听，杜绝残留泄漏。
 */
import { h, render } from 'preact';
import type { VNode } from 'preact';

export { h };
export type { VNode };

/** 所有已挂载根：容器 → 卸载函数。供 FrameworkHost 统一清理。 */
const mountedRoots = new Map<HTMLElement, () => void>();

/**
 * 真正的 Preact 挂载：把 vnode 渲染进容器根，返回卸载函数。（预留 API，尚未接线；
 * 接线点=宿主抽屉关闭回调。）
 * - render 的首次渲染是同步的，调用后 DOM 立即就绪。
 * - 卸载用 render(null, container)，让 Preact 清空 vnode 树并自动注销
 *   onClick 等声明式事件监听（Preact 事件随 vnode 生命周期走）。
 * - 卸载函数带幂等保护，重复调用不会二次改动 DOM。
 */
export function mount(vnode: VNode, container: HTMLElement): () => void {
    render(vnode, container);
    let unmounted = false;
    const unmount = () => {
        if (unmounted) return;
        unmounted = true;
        render(null, container);
        mountedRoots.delete(container);
    };
    mountedRoots.set(container, unmount);
    return unmount;
}

/**
 * 挂载 vnode，并把一组原生事件监听绑定到同一生命周期。（预留 API，尚未接线；
 * 接线点=宿主抽屉关闭回调。）
 * 这是「事件监听随卸载注销」的落点：宿主抽屉关闭后若残留委托监听，
 * 会对已卸载节点继续响应并造成内存泄漏，故必须与 vnode 同生共死。
 * unmount 先注销全部原生监听，再卸载 vnode 树；顺序不可逆。
 */
export function mountWithListeners(
    vnode: VNode,
    container: HTMLElement,
    listeners: ReadonlyArray<{
        target: EventTarget;
        type: string;
        handler: EventListenerOrEventListenerObject;
    }>
): () => void {
    const unmountVNode = mount(vnode, container);
    for (const item of listeners) item.target.addEventListener(item.type, item.handler);
    let done = false;
    return () => {
        if (done) return;
        done = true;
        for (const item of listeners) item.target.removeEventListener(item.type, item.handler);
        unmountVNode();
    };
}

/**
 * 静态渲染通道：把 vnode 渲染到脱离文档的临时容器，同步取回 HTML 字符串。
 * 用于接入现有「字符串模板拼接」型挂载点——Preact 生成的真实 DOM 被序列化后
 * 嵌入原有 innerHTML，后续既有控制器（如 bindSegmented）照常做事件委托。
 *
 * 注意：此通道产出的节点不携带 Preact 声明式事件，交互仍由原有委托负责。
 * 需要 Preact 接管交互与局部更新时，应改用 mount() 通道。
 * 临时容器渲染完立即以 render(null) 清理，避免悬挂 vnode 引用。
 */
export function renderToHtml(vnode: VNode): string {
    const host = document.createElement('div');
    render(vnode, host);
    const html = host.innerHTML;
    render(null, host);
    return html;
}

/**
 * 框架宿主：集中登记所有挂载根，提供一次性卸载。（预留 API，尚未接线；
 * 接线点=宿主抽屉关闭回调。）
 * 第三步迁移完成后，各控制器在宿主抽屉关闭时调用 unmountAll()，
 * 即可一并清理 vnode 树与原生监听，避免逐处遗漏。
 */
export class FrameworkHost {
    private readonly cleanups = new Set<() => void>();

    /** 登记一个卸载函数；返回可单独调用的清理入口。 */
    public register(cleanup: () => void): () => void {
        this.cleanups.add(cleanup);
        return () => {
            cleanup();
            this.cleanups.delete(cleanup);
        };
    }

    /** 卸载全部根节点，清空登记。幂等，可安全重复调用。 */
    public unmountAll(): void {
        for (const cleanup of Array.from(this.cleanups)) {
            try {
                cleanup();
            } catch {
                // 单个根节点清理失败不阻断其余，宿主关闭路径必须走完。
            }
        }
        this.cleanups.clear();
    }

    /** 当前登记的根数量，供调试与测试断言。 */
    public size(): number {
        return this.cleanups.size;
    }
}

/** 进程级单例，供全局生命周期钩子取用。（预留 API，尚未接线；接线点=宿主抽屉关闭回调。） */
export const frameworkHost = new FrameworkHost();
