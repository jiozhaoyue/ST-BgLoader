import { BUILTIN_SCENES, SceneSnapshot } from '../types';

export class SceneManager {
    private userScenes: Record<string, SceneSnapshot> = {};
    private onApplySceneCallback?: (scene: SceneSnapshot) => void;

    constructor(userScenes: Record<string, SceneSnapshot> = {}, onApply?: (scene: SceneSnapshot) => void) {
        this.userScenes = { ...userScenes };
        this.onApplySceneCallback = onApply;
    }

    public setApplyCallback(cb: (scene: SceneSnapshot) => void): void {
        this.onApplySceneCallback = cb;
    }

    public setUserScenes(scenes: Record<string, SceneSnapshot>): void {
        this.userScenes = { ...scenes };
    }

    public getAllScenes(): Record<string, SceneSnapshot> {
        return {
            ...BUILTIN_SCENES,
            ...this.userScenes,
        };
    }

    public getUserScenes(): Record<string, SceneSnapshot> {
        return { ...this.userScenes };
    }

    public getScene(id: string): SceneSnapshot | undefined {
        return this.getAllScenes()[id];
    }

    public saveScene(scene: SceneSnapshot): void {
        this.userScenes[scene.id] = { ...scene, isBuiltin: false };
    }

    public deleteScene(id: string): boolean {
        if (BUILTIN_SCENES[id]) {
            console.warn(`[ST-BgLoader SceneManager] Cannot delete builtin scene "${id}"`);
            return false;
        }
        if (this.userScenes[id]) {
            delete this.userScenes[id];
            return true;
        }
        return false;
    }

    public applyScene(id: string): boolean {
        const scene = this.getScene(id);
        if (!scene) {
            console.warn(`[ST-BgLoader SceneManager] Scene "${id}" not found.`);
            return false;
        }

        console.log(`[ST-BgLoader SceneManager] Applying scene: "${scene.name}"`);
        this.onApplySceneCallback?.(scene);
        return true;
    }
}
