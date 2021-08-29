function makeGlobalKey(key: string): string {
  return `WindowTunnel/${key}`;
}

export const WindowTunnel = {
  /**
   * This should ONLY be called from the window set
   * as "start_window" in manifest.json (background window)
   * @param key Global key for tunnneled object
   * @param value Object to tunnel
   */
  set<T>(key: string, value: T): void {
    // console.log('WindowTunnel.set()', key, value);

    const w = window as Record<string, any>;

    w[makeGlobalKey(key)] = value;
  },

  get<T>(key: string): T {
    const w = overwolf.windows.getMainWindow() as Record<string, any>;

    const globalKey = makeGlobalKey(key);

    if (w[globalKey] === undefined) {
      throw new Error(`WindowTunnel.get(): "${key}" failed`);
    }

    // console.log('WindowTunnel.get()', key, w[globalKey]);

    return w[globalKey];
  }
};
