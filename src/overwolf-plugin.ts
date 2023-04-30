export class OverwolfPlugin<PluginType> {
  readonly #pluginName: string
  #plugin: PluginType | null = null
  #promise: Promise<PluginType> | null = null

  constructor(pluginName: string) {
    this.#pluginName = pluginName;
  }

  #getPlugin(): Promise<PluginType> {
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

  async getPlugin(): Promise<PluginType> {
    if (this.#plugin) {
      return this.#plugin;
    }

    if (!this.#promise) {
      this.#promise = this.#getPlugin();
    }

    this.#plugin = await this.#promise;

    this.#promise = null;

    return this.#plugin;
  }
}
