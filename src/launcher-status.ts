import { EventEmitter } from './event-emitter';
import { objectCopy } from './utils';

type LauncherInfo = overwolf.games.launchers.LauncherInfo | null

type LauncherStatusEventTypes = {
  focus: boolean,
  running: boolean,
  changed: LauncherInfo
}

export class LauncherStatus extends EventEmitter<LauncherStatusEventTypes> {
  #isInFocus: boolean
  #launcherInfo: LauncherInfo

  #started: boolean
  #startingPromise: Promise<void> | null

  #onLauncherLaunchedBound
  #onLauncherTerminatedBound
  #onLauncherInfoUpdatedBound

  constructor() {
    super();

    this.#onLauncherLaunchedBound = this.#onLauncherLaunched.bind(this);
    this.#onLauncherTerminatedBound = this.#onLauncherTerminated.bind(this);
    this.#onLauncherInfoUpdatedBound = this.#onLauncherInfoUpdated.bind(this);

    this.#launcherInfo = null;
    this.#isInFocus = false;

    this.#started = false;
    this.#startingPromise = null;
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

  get launcherID(): number | null {
    if (this.#launcherInfo && this.#launcherInfo.classId) {
      return this.#launcherInfo.classId;
    }

    return null;
  }

  async start(): Promise<void> {
    if (this.#started) {
      return;
    }

    if (this.#startingPromise) {
      return this.#startingPromise;
    }

    this.#startingPromise = this.#start();

    await this.#startingPromise;

    this.#startingPromise = null;
  }

  async #start(): Promise<void> {
    if (this.#started) {
      return;
    }

    if (this.#startingPromise) {
      await this.#startingPromise;
      return;
    }

    this.destroy();

    overwolf.games.launchers.onLaunched
      .addListener(this.#onLauncherLaunchedBound);
    overwolf.games.launchers.onTerminated
      .addListener(this.#onLauncherTerminatedBound);
    overwolf.games.launchers.onUpdated
      .addListener(this.#onLauncherInfoUpdatedBound);

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

    this.#started = true;
  }

  /** Remove all listeners */
  destroy(): void {
    overwolf.games.launchers.onLaunched
      .removeListener(this.#onLauncherLaunchedBound);
    overwolf.games.launchers.onTerminated
      .removeListener(this.#onLauncherTerminatedBound);
    overwolf.games.launchers.onUpdated
      .removeListener(this.#onLauncherInfoUpdatedBound);

    this.#started = false;
  }

  #onLauncherLaunched(
    info: overwolf.games.launchers.LauncherInfo
  ): void {
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

  #onLauncherTerminated(): void {
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

  #onLauncherInfoUpdated(
    { info }: overwolf.games.launchers.UpdatedEvent
  ): void {
    // console.log('onLauncherInfoUpdated', info, changeType)

    const isInFocusChanged = (info.isInFocus !== this.#isInFocus);

    this.#launcherInfo = info;

    if (isInFocusChanged) {
      this.#isInFocus = info.isInFocus;
      this.emit('focus', info.isInFocus);
    }

    this.emit('changed', this.launcherInfo);
  }
}
