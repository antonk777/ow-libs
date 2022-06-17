export class OverwolfPlugin<PluginType> {
  readonly #pluginName: string
  #plugin: PluginType | null = null
  #loadingPromise: Promise<PluginType> | null = null

  constructor(pluginName: string) {
    this.#pluginName = pluginName;
  }

  get plugin(): PluginType {
    if (this.#plugin !== null) {
      return this.#plugin;
    }

    throw new Error('plugin not initialized');
  }

  #loadPluginPromise(): Promise<PluginType> {
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

  async loadPlugin(): Promise<PluginType> {
    if (this.#plugin) {
      return this.#plugin;
    }

    if (!this.#loadingPromise) {
      this.#loadingPromise = this.#loadPluginPromise();
    }

    this.#plugin = await this.#loadingPromise;

    this.#loadingPromise = null;

    return this.#plugin;
  }
}
