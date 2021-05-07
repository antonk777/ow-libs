/* global overwolf*/
import { binder } from './binder';
import { EventEmitter } from './';
export class LauncherStatus extends EventEmitter {
    constructor() {
        super();
        this.launcherInfo = null;
        this.isInFocus = false;
        this.bound = binder(this);
        this.started = false;
        this.startPromise = this.start();
    }
    get isRunning() {
        return !!this.launcherInfo;
    }
    async start() {
        if (this.started)
            return;
        if (this.startPromise) {
            await this.startPromise;
            return;
        }
        const launchersInfo = await new Promise(resolve => {
            overwolf.games.launchers.getRunningLaunchersInfo(resolve);
        });
        if (launchersInfo.success &&
            launchersInfo.launchers &&
            launchersInfo.launchers.length) {
            this.launcherInfo = launchersInfo.launchers[0];
        }
        else {
            this.launcherInfo = null;
        }
        this.isInFocus = !!(this.launcherInfo && this.launcherInfo.isInFocus);
        overwolf.games.launchers.onLaunched
            .addListener(this.bound.onLauncherLaunched);
        overwolf.games.launchers.onTerminated
            .addListener(this.bound.onLauncherTerminated);
        overwolf.games.launchers.onUpdated
            .addListener(this.bound.onLauncherInfoUpdated);
        this.started = true;
    }
    destroy() {
        overwolf.games.launchers.onLaunched
            .removeListener(this.bound.onLauncherLaunched);
        overwolf.games.launchers.onTerminated
            .removeListener(this.bound.onLauncherTerminated);
        overwolf.games.launchers.onUpdated
            .removeListener(this.bound.onLauncherInfoUpdated);
    }
    onLauncherLaunched(info) {
        // console.log('onLauncherLaunched', info)
        const isInFocusChanged = (info.isInFocus !== this.isInFocus);
        this.launcherInfo = info;
        if (isInFocusChanged) {
            this.isInFocus = info.isInFocus;
            this.emit('focus');
        }
        this.emit('running');
        this.emit('*');
    }
    onLauncherTerminated() {
        // console.log('onLauncherTerminated')
        const isInFocusChanged = this.isInFocus;
        this.launcherInfo = null;
        this.isInFocus = false;
        this.emit('running');
        if (isInFocusChanged) {
            this.emit('focus');
        }
        this.emit('*');
    }
    onLauncherInfoUpdated({ info }) {
        // console.log('onLauncherInfoUpdated', info, changeType)
        const isInFocusChanged = (info.isInFocus !== this.isInFocus);
        this.launcherInfo = info;
        if (isInFocusChanged) {
            this.isInFocus = info.isInFocus;
        }
        if (isInFocusChanged) {
            this.emit('focus');
        }
        this.emit('*');
    }
    get launcherID() {
        if (this.launcherInfo && this.launcherInfo.classId) {
            return this.launcherInfo.classId;
        }
        return null;
    }
}
//# sourceMappingURL=launcher-status.js.map