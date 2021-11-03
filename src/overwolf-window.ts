export class OverwolfWindow {
  #name: string
  #id: string | null

  constructor(name: string) {
    this.#name = name;
    this.#id = null;
  }

  private async obtain(): Promise<overwolf.windows.WindowInfo> {
    const result: overwolf.windows.WindowResult = await new Promise(resolve => {
      overwolf.windows.obtainDeclaredWindow(this.#name, resolve);
    });

    if (result && result.success && result.window && result.window.id) {
      this.#id = result.window.id;

      return result.window;
    }

    this.#id = null;

    throw new OverwolfWindowError({
      args: [this.#name],
      result
    });
  }

  async restore(): Promise<void> {
    await this.obtain();

    const result: overwolf.windows.WindowIdResult =
      await new Promise(resolve => {
        overwolf.windows.restore(this.#id as string, resolve);
      });

    if (!result || !result.success) {
      throw new OverwolfWindowError({
        args: [this.#id],
        result
      });
    }
  }

  async minimize(): Promise<void> {
    await this.obtain();

    const result: overwolf.windows.WindowIdResult =
      await new Promise(resolve => {
        overwolf.windows.minimize(this.#id as string, resolve);
      });

    if (!result || !result.success) {
      throw new OverwolfWindowError({
        args: [this.#id],
        result
      });
    }
  }

  async maximize(): Promise<void> {
    await this.obtain();

    const result: overwolf.windows.WindowIdResult =
      await new Promise(resolve => {
        overwolf.windows.maximize(this.#id as string, resolve);
      });

    if (!result || !result.success) {
      throw new OverwolfWindowError({
        args: [this.#id],
        result
      });
    }
  }

  async hide(): Promise<void> {
    await this.obtain();

    const result: overwolf.windows.WindowIdResult =
      await new Promise(resolve => {
        overwolf.windows.hide(this.#id as string, resolve);
      });

    if (!result || !result.success) {
      throw new OverwolfWindowError({
        args: [this.#id],
        result
      });
    }
  }

  async changeSize(
    width: number,
    height: number,
    autoDpiResize = true
  ): Promise<void> {
    await this.obtain();

    const changeSizeParams: overwolf.windows.ChangeWindowSizeParams = {
      window_id: this.#id as string,
      width,
      height,
      auto_dpi_resize: autoDpiResize
    };

    const result: overwolf.Result = await new Promise(resolve => {
      overwolf.windows.changeSize(changeSizeParams, resolve);
    });

    if (!result || !result.success) {
      throw new OverwolfWindowError({
        args: [changeSizeParams],
        result
      });
    }
  }

  async changePosition(left: number, top: number): Promise<void> {
    await this.obtain();

    const result: overwolf.windows.WindowIdResult =
      await new Promise(resolve => {
        overwolf.windows.changePosition(this.#id as string, left, top, resolve);
      });

    if (!result || !result.success) {
      throw new OverwolfWindowError({
        args: [this.#id, left, top],
        result
      });
    }
  }

  async dragMove(): Promise<overwolf.windows.DragMovedResult> {
    await this.obtain();

    const result: overwolf.windows.DragMovedResult =
      await new Promise(resolve => {
        overwolf.windows.dragMove(this.#id as string, resolve);
      });

    if (result && result.success) {
      return result;
    }

    throw new OverwolfWindowError({
      args: [this.#id],
      result
    });

  }

  async dragResize(edge: overwolf.windows.enums.WindowDragEdge): Promise<void> {
    await this.obtain();

    overwolf.windows.dragResize(this.#id as string, edge);
  }

  async getWindowState(): Promise<overwolf.windows.GetWindowStateResult> {
    const result: overwolf.windows.GetWindowStateResult =
      await new Promise(resolve => {
        overwolf.windows.getWindowState(this.#name, resolve);
      });

    if (result && result.success) {
      return result;
    }

    throw new OverwolfWindowError({
      args: [this.#name],
      result
    });

  }

  async setTopmost(shouldBeTopmost: boolean): Promise<void> {
    await this.obtain();

    const result: overwolf.windows.WindowIdResult =
      await new Promise(resolve => {
        overwolf.windows.setTopmost(
          this.#id as string,
          shouldBeTopmost,
          resolve
        );
      });

    if (!result || !result.success) {
      throw new OverwolfWindowError({
        args: [this.#id, shouldBeTopmost],
        result
      });
    }
  }

  async sendToBack(): Promise<void> {
    await this.obtain();

    const result: overwolf.windows.WindowIdResult =
      await new Promise(resolve => {
        overwolf.windows.sendToBack(this.#id as string, resolve);
      });

    if (!result || !result.success) {
      throw new OverwolfWindowError({
        args: [this.#id],
        result
      });
    }
  }

  async bringToFront(grabFocus: boolean): Promise<void> {
    await this.obtain();

    const result: overwolf.windows.WindowIdResult =
      await new Promise(resolve => {
        overwolf.windows.bringToFront(this.#id as string, grabFocus, resolve);
      });

    if (!result || !result.success) {
      throw new OverwolfWindowError({
        args: [this.#id, grabFocus],
        result
      });
    }
  }

  async setPosition(
    properties: overwolf.windows.SetWindowPositionProperties
  ): Promise<void> {
    await this.obtain();

    const result: overwolf.Result = await new Promise(resolve => {
      overwolf.windows.setPosition(this.#id as string, properties, resolve);
    });

    if (!result || !result.success) {
      throw new OverwolfWindowError({
        args: [this.#id, properties],
        result
      });
    }
  }

  async _internalClose(): Promise<void> {
    await this.obtain();

    const result: overwolf.windows.WindowIdResult =
      await new Promise(resolve => {
        overwolf.windows.close(this.#id as string, resolve);
      });

    if (!result || !result.success) {
      throw new OverwolfWindowError({
        args: [this.#id],
        result
      });
    }
  }

  async close(): Promise<void> {
    const state = await this.getWindowState();

    console.log(
      'close():',
      this.#name,
      state.window_state_ex,
    );

    // console.trace();

    if (state.success && state.window_state_ex !== 'closed') {
      await this._internalClose();
    }
  }

  async toggle(): Promise<void> {
    const state = await this.getWindowState();

    if (!state.success) {
      return;
    }

    console.log(
      'close():',
      this.#name,
      state.window_state_ex,
    );

    switch (state.window_state_ex) {
      case 'closed':
      case 'minimized':
      case 'hidden':
        await this.restore();
        break;
      default:
        await this._internalClose();
        break;
    }
  }

  async setZoom(zoomFactor: number): Promise<void> {
    await this.obtain();

    overwolf.windows.setZoom(zoomFactor, this.#id as string);
  }

  async center(): Promise<void> {
    const [
      win,
      viewport
    ] = await Promise.all([
      this.obtain(),
      OverwolfWindow.getViewportSize()
    ]);

    let
      left = (viewport.width / 2) - (win.width / 2),
      top = (viewport.height / 2) - (win.height / 2);

    left = Math.max(left, 0);
    top = Math.max(top, 0);

    left = Math.floor(left);
    top = Math.floor(top);

    await this.changePosition(left, top);
  }

  static getWindowsStates(): Promise<overwolf.windows.GetWindowsStatesResult> {
    return new Promise(resolve => overwolf.windows.getWindowsStates(resolve));
  }

  static getViewportSize(): Promise<{ width: number, height: number }> {
    return new Promise((resolve, reject) => {
      overwolf.utils.getMonitorsList(result => {
        let width = -1,
          height = -1;

        for (const display of result.displays) {
          if (display.is_primary) {
            width = display.width;
            height = display.height;
          }
        }

        overwolf.games.getRunningGameInfo(game => {
          if (game && game.isInFocus) {
            width = game.logicalWidth;
            height = game.logicalHeight;
          }

          if (width !== -1 && height !== -1) {
            resolve({ width, height });
          } else {
            reject(new Error('Could not get monitors width/height'));
          }
        });
      });
    });
  }

  static getMonitorsList(): Promise<overwolf.utils.getMonitorsListResult> {
    return new Promise(resolve => overwolf.utils.getMonitorsList(resolve));
  }

  static async isWindowVisibleToUser()
  : Promise<overwolf.windows.IsWindowVisibleToUserResult> {

    const result: overwolf.windows.IsWindowVisibleToUserResult =
      await new Promise(resolve => {
        overwolf.windows.isWindowVisibleToUser(resolve);
      });

    if (result && result.success) {
      return result;
    }

    throw new OverwolfWindowError({ result });
  }
}

type OverwolfWindowErrorProps = {
  result: overwolf.Result,
  args?: (
      null
      | string
      | number
      | boolean
      | overwolf.windows.SetWindowPositionProperties
      | overwolf.windows.ChangeWindowSizeParams
    )[]
}

export class OverwolfWindowError extends Error {
  constructor({ result, args = [] }: OverwolfWindowErrorProps) {
    let message = JSON.stringify(result);

    if (args && args.length) {
      message += ` args: ${JSON.stringify(args)}`;
    }

    super(message);

    this.name = 'OverwolfWindowError';

    const errConst = Error as Record<string, any>;

    if (errConst.captureStackTrace) {
      errConst.captureStackTrace(this, OverwolfWindowError);
    }
  }
}
