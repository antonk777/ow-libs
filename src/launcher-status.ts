/* global overwolf*/

import { binder } from './binder';
import { EventEmitter } from './';

export class LauncherStatus extends EventEmitter {
  public isInFocus: boolean
  public launcherInfo: overwolf.games.launchers.LauncherInfo | null
  private bound: LauncherStatus
  private started: boolean
  private startPromise: Promise<void>

  constructor() {
    super();

    this.launcherInfo = null;
    this.isInFocus = false;

    this.bound = binder<LauncherStatus>(this);
    this.started = false;
    this.startPromise = this.start();
  }

  get isRunning(): boolean {
    return !!this.launcherInfo;
  }

  async start(): Promise<void> {
    if (this.started) return;

    if (this.startPromise) {
      await this.startPromise;
      return;
    }

    const launchersInfo:
      overwolf.games.launchers.GetRunningLaunchersInfoResult =
        await new Promise(resolve => {
          overwolf.games.launchers.getRunningLaunchersInfo(resolve);
        });

    if (
      launchersInfo.success &&
      launchersInfo.launchers &&
      launchersInfo.launchers.length
    ) {
      this.launcherInfo = launchersInfo.launchers[0];
    } else {
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

  destroy(): void {
    overwolf.games.launchers.onLaunched
      .removeListener(this.bound.onLauncherLaunched);
    overwolf.games.launchers.onTerminated
      .removeListener(this.bound.onLauncherTerminated);
    overwolf.games.launchers.onUpdated
      .removeListener(this.bound.onLauncherInfoUpdated);
  }

  onLauncherLaunched(info: overwolf.games.launchers.LauncherInfo): void {
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

  onLauncherTerminated(): void {
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

  onLauncherInfoUpdated({ info }: overwolf.games.launchers.UpdatedEvent): void {
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

  get launcherID(): number | null {
    if (this.launcherInfo && this.launcherInfo.classId) {
      return this.launcherInfo.classId;
    }

    return null;

  }
}
