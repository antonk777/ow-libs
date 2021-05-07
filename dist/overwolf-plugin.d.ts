export declare class OverwolfPlugin {
    protected pluginName: string;
    protected plugin: any;
    protected loadingPromise: Promise<any> | null;
    constructor(pluginName: string);
    private _loadPlugin;
    loadPlugin(): Promise<any>;
}
