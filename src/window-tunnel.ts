function makeGlobalKey(key: string): string {
  return `WindowTunnel/${key}`;
}

export const WindowTunnel = {
  set<T>(key: string, value: T): void {
    const w = overwolf.windows.getMainWindow() as Record<string, any>;

    w[makeGlobalKey(key)] = value;
  },

  get<T>(key: string): T {
    const w = overwolf.windows.getMainWindow() as Record<string, any>;

    const globalKey = makeGlobalKey(key);

    if (w[globalKey] === undefined) {
      throw new Error(`WindowTunnel.get(): "${key}" failed`);
    }

    return w[globalKey];
  }
};
