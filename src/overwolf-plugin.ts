export class OverwolfPlugin {
  readonly #pluginName: string
  #plugin: any = null
  #loadingPromise: Promise<any> | null = null

  constructor(pluginName: string) {
    this.#pluginName = pluginName;
  }

  get plugin(): any {
    return this.#plugin;
  }

  private _loadPluginPromise(): Promise<any> {
    return new Promise((resolve, reject) => {
      overwolf.extensions.current.getExtraObject(this.#pluginName, result => {
        if (result.success && result.object) {
          resolve(result.object);
        } else {
          const msg =
            `Could not load ${this.#pluginName}: ${JSON.stringify(result)}`;
          console.warn(`OverwolfPlugin.load(): error: ${msg}`);
          reject(msg);
        }
      });
    });
  }

  async loadPlugin(): Promise<any> {
    if (this.#plugin) {
      return this.#plugin;
    }

    if (!this.#loadingPromise) {
      this.#loadingPromise = this._loadPluginPromise();
    }

    this.#plugin = await this.#loadingPromise;

    this.#loadingPromise = null;

    return this.#plugin;
  }
}
