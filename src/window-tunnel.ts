function makeGlobalKey(key: string): string {
  return `WindowTunnel/${key}`;
}

export const WindowTunnel = {
  /**
   * Set a global object that will be shared between all windows.
   * This should ONLY be called from the window set as "start_window"
   * in manifest.json (background window)
   * @param key Global name for tunneled object
   * @param value Object to tunnel
   */
  set<T>(key: string, value: T): void {
    // console.log('WindowTunnel.set()', key, value);

    const w = window as Record<string, any>;

    w[makeGlobalKey(key)] = value;
  },

  /**
   * Get a global tunneled object.
   * @param key Global name for tunneled object
   * @returns Tunneled object
   */
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
