/* global overwolf*/

import { binder } from './binder';
import { SingleEvent } from './single-event';
import { objectCopy } from './utils';

type LauncherInfo = overwolf.games.launchers.LauncherInfo | null

export class LauncherStatus {
  #isInFocus: boolean
  #launcherInfo: LauncherInfo

  readonly #bound: LauncherStatus
  #started: boolean
  readonly #startPromise: Promise<void>

  public readonly onFocusChanged: SingleEvent<boolean>
  public readonly onRunningChanged: SingleEvent<boolean>
  public readonly onChanged: SingleEvent<LauncherStatus>

  constructor() {
    this.#launcherInfo = null;
    this.#isInFocus = false;

    this.#bound = binder<LauncherStatus>(this);
    this.#started = false;
    this.#startPromise = this.start();

    this.onFocusChanged = new SingleEvent();
    this.onRunningChanged = new SingleEvent();
    this.onChanged = new SingleEvent();
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
      this.onFocusChanged.callListener(this.#isInFocus);
    }

    this.onRunningChanged.callListener(true);
    this.onChanged.callListener(this);
  }

  onLauncherTerminated(): void {
    // console.log('onLauncherTerminated')

    const isInFocusChanged = this.#isInFocus;

    this.#launcherInfo = null;
    this.#isInFocus = false;

    if (isInFocusChanged) {
      this.onFocusChanged.callListener(this.#isInFocus);
    }

    this.onRunningChanged.callListener(false);
    this.onChanged.callListener(this);
  }

  onLauncherInfoUpdated({ info }: overwolf.games.launchers.UpdatedEvent): void {
    // console.log('onLauncherInfoUpdated', info, changeType)

    const isInFocusChanged = (info.isInFocus !== this.#isInFocus);

    this.#launcherInfo = info;

    if (isInFocusChanged) {
      this.#isInFocus = info.isInFocus;
      this.onFocusChanged.callListener(this.#isInFocus);
    }

    this.onChanged.callListener(this);
  }

  get launcherID(): number | null {
    if (this.#launcherInfo && this.#launcherInfo.classId) {
      return this.#launcherInfo.classId;
    }

    return null;
  }
}
