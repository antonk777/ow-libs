/* global overwolf*/

export class OverwolfPlugin {
  protected pluginName: string
  protected plugin: any
  protected loadingPromise: Promise<any> | null

  constructor(pluginName: string) {
    this.pluginName = pluginName;
    this.plugin = null;
    this.loadingPromise = null;
  }

  private _loadPlugin(): Promise<any> {
    return new Promise((resolve, reject) => {
      overwolf.extensions.current.getExtraObject(this.pluginName, result => {
        if (result.success && result.object) {
          resolve(result.object);
        } else {
          const msg =
            `Could not load ${this.pluginName}: ${JSON.stringify(result)}`;
          console.warn(`OverwolfPlugin.load(): error: ${msg}`);
          reject(msg);
        }
      });
    });
  }

  async loadPlugin(): Promise<any> {
    if (this.plugin) return this.plugin;

    if (!this.loadingPromise) this.loadingPromise = this._loadPlugin();

    this.plugin = await this.loadingPromise;

    this.loadingPromise = null;

    return this.loadingPromise;
  }
}
