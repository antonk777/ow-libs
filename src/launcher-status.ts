import { binder } from './binder';
import { EventEmitter } from './event-emitter';
import { objectCopy } from './utils';

type LauncherInfo = overwolf.games.launchers.LauncherInfo | null

type LauncherStatusEventTypes = {
  focus: boolean,
  running: boolean,
  changed: LauncherInfo
}

export class LauncherStatus extends EventEmitter<LauncherStatusEventTypes> {
  readonly #bound: LauncherStatus

  #isInFocus: boolean
  #launcherInfo: LauncherInfo

  #started: boolean
  readonly #startPromise: Promise<void> | null

  constructor() {
    super();

    this.#bound = binder<LauncherStatus>(this);

    this.#launcherInfo = null;
    this.#isInFocus = false;

    this.#started = false;
    this.#startPromise = this.start();
  }

  get isRunning(): boolean {
    return !!this.#launcherInfo;
  }

  get isInFocus(): boolean {
    return this.#isInFocus;
  }

  get launcherInfo(): LauncherInfo {
    return objectCopy<LauncherInfo>(this.#launcherInfo);
  }

  async start(): Promise<void> {
    if (this.#started) {
      return;
    }

    if (this.#startPromise) {
      await this.#startPromise;
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
      this.#launcherInfo = launchersInfo.launchers[0];
    } else {
      this.#launcherInfo = null;
    }

    this.#isInFocus = !!(this.#launcherInfo && this.#launcherInfo.isInFocus);

    overwolf.games.launchers.onLaunched
      .removeListener(this.#bound.onLauncherLaunched);
    overwolf.games.launchers.onTerminated
      .removeListener(this.#bound.onLauncherTerminated);
    overwolf.games.launchers.onUpdated
      .removeListener(this.#bound.onLauncherInfoUpdated);

    overwolf.games.launchers.onLaunched
      .addListener(this.#bound.onLauncherLaunched);
    overwolf.games.launchers.onTerminated
      .addListener(this.#bound.onLauncherTerminated);
    overwolf.games.launchers.onUpdated
      .addListener(this.#bound.onLauncherInfoUpdated);

    this.#started = true;
  }

  destroy(): void {
    overwolf.games.launchers.onLaunched
      .removeListener(this.#bound.onLauncherLaunched);
    overwolf.games.launchers.onTerminated
      .removeListener(this.#bound.onLauncherTerminated);
    overwolf.games.launchers.onUpdated
      .removeListener(this.#bound.onLauncherInfoUpdated);
  }

  onLauncherLaunched(info: overwolf.games.launchers.LauncherInfo): void {
    // console.log('onLauncherLaunched', info)

    const isInFocusChanged = (info.isInFocus !== this.#isInFocus);

    this.#launcherInfo = info;

    if (isInFocusChanged) {
      this.#isInFocus = info.isInFocus;
      this.emit('focus', info.isInFocus);
    }

    this.emit('running', true);
    this.emit('changed', this.launcherInfo);
  }

  onLauncherTerminated(): void {
    // console.log('onLauncherTerminated')

    const isInFocusChanged = this.#isInFocus;

    this.#launcherInfo = null;
    this.#isInFocus = false;

    if (isInFocusChanged) {
      this.emit('focus', false);
    }

    this.emit('running', false);
    this.emit('changed', this.launcherInfo);
  }

  onLauncherInfoUpdated({ info }: overwolf.games.launchers.UpdatedEvent): void {
    // console.log('onLauncherInfoUpdated', info, changeType)

    const isInFocusChanged = (info.isInFocus !== this.#isInFocus);

    this.#launcherInfo = info;

    if (isInFocusChanged) {
      this.#isInFocus = info.isInFocus;
      this.emit('focus', info.isInFocus);
    }

    this.emit('changed', this.launcherInfo);
  }

  get launcherID(): number | null {
    if (this.#launcherInfo && this.#launcherInfo.classId) {
      return this.#launcherInfo.classId;
    }

    return null;
  }
}
