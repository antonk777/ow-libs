/* global overwolf*/
const NOT_CURRENT_WINDOW = 'Method does not support windows other than current';
export class OverwolfWindow {
    constructor(name = null) {
        this.name = name;
        this.id = null;
    }
    get isCurrent() {
        return (this.name === null);
    }
    obtain() {
        if (this.isCurrent) {
            return this.obtainCurrent();
        }
        return this.obtainByName();
    }
    async obtainCurrent() {
        const result = await new Promise(resolve => {
            overwolf.windows.getCurrentWindow(resolve);
        });
        if (result && result.success && result.window && result.window.id) {
            this.id = result.window.id;
            return result.window;
        }
        this.id = null;
        throw new OverwolfWindowError({ result });
    }
    async obtainByName() {
        const result = await new Promise(resolve => {
            overwolf.windows.obtainDeclaredWindow(this.name, resolve);
        });
        if (result && result.success && result.window && result.window.id) {
            this.id = result.window.id;
            return result.window;
        }
        this.id = null;
        throw new OverwolfWindowError({
            args: [this.name],
            result
        });
    }
    async restore() {
        await this.obtain();
        const result = await new Promise(resolve => {
            overwolf.windows.restore(this.id, resolve);
        });
        if (!result || !result.success) {
            throw new OverwolfWindowError({
                args: [this.id],
                result
            });
        }
    }
    async minimize() {
        await this.obtain();
        const result = await new Promise(resolve => {
            overwolf.windows.minimize(this.id, resolve);
        });
        if (!result || !result.success) {
            throw new OverwolfWindowError({
                args: [this.id],
                result
            });
        }
    }
    async maximize() {
        await this.obtain();
        const result = await new Promise(resolve => {
            overwolf.windows.maximize(this.id, resolve);
        });
        if (!result || !result.success) {
            throw new OverwolfWindowError({
                args: [this.id],
                result
            });
        }
    }
    async hide() {
        await this.obtain();
        const result = await new Promise(resolve => {
            overwolf.windows.hide(this.id, resolve);
        });
        if (!result || !result.success) {
            throw new OverwolfWindowError({
                args: [this.id],
                result
            });
        }
    }
    async changeSize(width, height, autoDpiResize = true) {
        await this.obtain();
        const changeSizeParams = {
            window_id: this.id,
            width,
            height,
            auto_dpi_resize: autoDpiResize
        };
        const result = await new Promise(resolve => {
            overwolf.windows.changeSize(changeSizeParams, resolve);
        });
        if (!result || !result.success) {
            throw new OverwolfWindowError({
                args: [changeSizeParams],
                result
            });
        }
    }
    async changePosition(left, top) {
        await this.obtain();
        const result = await new Promise(resolve => {
            overwolf.windows.changePosition(this.id, left, top, resolve);
        });
        if (!result || !result.success) {
            throw new OverwolfWindowError({
                args: [this.id, left, top],
                result
            });
        }
    }
    async dragMove() {
        await this.obtain();
        const result = await new Promise(resolve => {
            overwolf.windows.dragMove(this.id, resolve);
        });
        if (result && result.success) {
            return result;
        }
        throw new OverwolfWindowError({
            args: [this.id],
            result
        });
    }
    async dragResize(edge) {
        await this.obtain();
        overwolf.windows.dragResize(this.id, edge);
    }
    async getWindowState() {
        await this.obtain();
        const result = await new Promise(resolve => {
            overwolf.windows.getWindowState(this.id, resolve);
        });
        if (result && result.success) {
            return result;
        }
        throw new OverwolfWindowError({
            args: [this.id],
            result
        });
    }
    async setTopmost(shouldBeTopmost) {
        await this.obtain();
        const result = await new Promise(resolve => {
            overwolf.windows.setTopmost(this.id, shouldBeTopmost, resolve);
        });
        if (!result || !result.success) {
            throw new OverwolfWindowError({
                args: [this.id, shouldBeTopmost],
                result
            });
        }
    }
    async sendToBack() {
        await this.obtain();
        const result = await new Promise(resolve => {
            overwolf.windows.sendToBack(this.id, resolve);
        });
        if (!result || !result.success) {
            throw new OverwolfWindowError({
                args: [this.id],
                result
            });
        }
    }
    async bringToFront(grabFocus) {
        await this.obtain();
        const result = await new Promise(resolve => {
            overwolf.windows.bringToFront(this.id, grabFocus, resolve);
        });
        if (!result || !result.success) {
            throw new OverwolfWindowError({
                args: [this.id, grabFocus],
                result
            });
        }
    }
    async setPosition(properties) {
        await this.obtain();
        const result = await new Promise(resolve => {
            overwolf.windows.setPosition(this.id, properties, resolve);
        });
        if (!result || !result.success) {
            throw new OverwolfWindowError({
                args: [this.id, properties],
                result
            });
        }
    }
    async isWindowVisibleToUser() {
        if (!this.isCurrent)
            throw new Error(NOT_CURRENT_WINDOW);
        const result = await new Promise(resolve => {
            overwolf.windows.isWindowVisibleToUser(resolve);
        });
        if (result && result.success) {
            return result;
        }
        throw new OverwolfWindowError({ result });
    }
    async close() {
        const win = await this.obtain();
        if (win && win.stateEx !== 'closed') {
            const result = await new Promise(resolve => {
                overwolf.windows.close(this.id, resolve);
            });
            if (!result || !result.success) {
                throw new OverwolfWindowError({
                    args: [this.id],
                    result
                });
            }
        }
    }
    async toggle() {
        const win = await this.obtain();
        switch (win.stateEx) {
            case 'closed':
            case 'minimized':
            case 'hidden':
                await this.restore();
                break;
            default:
                await this.close();
                break;
        }
    }
    async setZoom(zoomFactor) {
        await this.obtain();
        overwolf.windows.setZoom(zoomFactor, this.id);
    }
    async center() {
        const [win, viewport] = await Promise.all([
            this.obtain(),
            OverwolfWindow.getViewportSize()
        ]);
        let left = (viewport.width / 2) - (win.width / 2), top = (viewport.height / 2) - (win.height / 2);
        left = Math.max(left, 0);
        top = Math.max(top, 0);
        left = Math.floor(left);
        top = Math.floor(top);
        await this.changePosition(left, top);
    }
    static getWindowsStates() {
        return new Promise(resolve => overwolf.windows.getWindowsStates(resolve));
    }
    static getViewportSize() {
        return new Promise((resolve, reject) => {
            overwolf.utils.getMonitorsList(result => {
                let width = -1, height = -1;
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
                    }
                    else {
                        reject(new Error('Could not get monitors width/height'));
                    }
                });
            });
        });
    }
    static getMonitorsList() {
        return new Promise(resolve => overwolf.utils.getMonitorsList(resolve));
    }
}
export class OverwolfWindowError extends Error {
    constructor({ result, args = [] }) {
        let message = JSON.stringify(result);
        if (args && args.length)
            message += ` args: ${JSON.stringify(args)}`;
        super(message);
        this.name = 'OverwolfWindowError';
        // if ( Error.captureStackTrace )
        //   Error.captureStackTrace(this, OverwolfWindowError)
    }
}
//# sourceMappingURL=overwolf-window.js.map