/* global overwolf*/
export class OverwolfPlugin {
    constructor(pluginName) {
        this.pluginName = pluginName;
        this.plugin = null;
        this.loadingPromise = null;
    }
    _loadPlugin() {
        return new Promise((resolve, reject) => {
            overwolf.extensions.current.getExtraObject(this.pluginName, result => {
                if (result.success && result.object) {
                    resolve(result.object);
                }
                else {
                    const msg = `Could not load ${this.pluginName}: ${JSON.stringify(result)}`;
                    console.warn(`OverwolfPlugin.load(): error: ${msg}`);
                    reject(msg);
                }
            });
        });
    }
    async loadPlugin() {
        if (this.plugin)
            return this.plugin;
        if (!this.loadingPromise)
            this.loadingPromise = this._loadPlugin();
        this.plugin = await this.loadingPromise;
        this.loadingPromise = null;
        return this.loadingPromise;
    }
}
//# sourceMappingURL=overwolf-plugin.js.map