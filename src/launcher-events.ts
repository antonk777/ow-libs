import { delay, EventEmitter, log, objectCopy } from '.';
import type { LauncherStatus } from '.';

export type LauncherEvent<Path, Val> = {
  path: Path
  val: Val
}

type LauncherEventsTypes<EventTypes extends Record<string, any>> =
  {
    '*': LauncherEvent<keyof EventTypes, EventTypes[keyof EventTypes]>;
  } & {
    [Path in keyof EventTypes]: LauncherEvent<Path, EventTypes[Path]>;
  };

export class LauncherEvents<EventTypes extends Record<string, any>>
  extends EventEmitter<LauncherEventsTypes<EventTypes>> {

  readonly #launcherID: number
  readonly #features: string[]
  readonly #launcherStatus: LauncherStatus

  readonly #state: Partial<EventTypes>
  readonly #retries: number

  #started: boolean
  #startingPromise: Promise<void> | null
  #logging: boolean

  #onErrorBound
  #onInfoUpdateBound
  #onNewEventBound

  constructor(
    launcherID: number,
    features: string[],
    launcherStatus: LauncherStatus,
    logging = false
  ) {
    super();

    this.#logging = logging;

    this.#onErrorBound = this.#onError.bind(this);
    this.#onInfoUpdateBound = this.#onInfoUpdate.bind(this);
    this.#onNewEventBound = this.#onNewEvent.bind(this);

    this.#launcherID = launcherID;
    this.#features = features;
    this.#launcherStatus = launcherStatus;

    this.#state = {};
    this.#retries = 25;

    this.#started = false;
    this.#startingPromise = null;
  }

  /** Copy of current state, both info updates and last event values */
  get state(): Partial<EventTypes> {
    return objectCopy(this.#state);
  }

  /**
   * Call overwolf.games.launchers.events.setRequiredFeatures and bind listeners
   * @see https://overwolf.github.io/docs/api/overwolf-games-events#setrequiredfeaturesfeatures-callback
   */
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
    this.#stop();

    const success = await this.#setRequiredFeatures();

    if (success) {
      this.#setListeners();
      overwolf.games.launchers.events.getInfo(
        this.#launcherID,
        result => this.#onGotInfo(result)
      );
    }

    this.#started = true;
  }

  /** Remove all listeners and clear the {@link state} */
  async stop(): Promise<void> {
    if (!this.#started) {
      return;
    }

    if (this.#startingPromise) {
      await this.#startingPromise;
      this.#startingPromise = null;
    }

    this.#stop();
    this.#started = false;
  }

  #stop(): void {
    for (const key in this.#state) {
      if (this.#state.hasOwnProperty(key)) {
        delete this.#state[key];
      }
    }

    this.#removeListeners();
  }

  /** Remove all listeners and clear the {@link state} */
  destroy(): Promise<void> {
    return this.stop();
  }

  #removeListeners(): void {
    overwolf.games.events.onError.removeListener(this.#onErrorBound);
    overwolf.games.launchers.events.onInfoUpdates.removeListener(
      this.#onInfoUpdateBound
    );
    overwolf.games.launchers.events.onNewEvents.removeListener(
      this.#onNewEventBound
    );
  }

  #setListeners(): void {
    this.#removeListeners();

    overwolf.games.events.onError.addListener(this.#onErrorBound);
    overwolf.games.launchers.events.onInfoUpdates.addListener(
      this.#onInfoUpdateBound
    );
    overwolf.games.launchers.events.onNewEvents.addListener(
      this.#onNewEventBound
    );
  }

  #onError(err: overwolf.games.events.ErrorEvent): void {
    console.log('LauncherEvents.#onError():', err);
  }

  #onGotInfo(data: overwolf.games.launchers.events.GetInfoResult): void {
    if (this.#logging) {
      console.log('LauncherEvents.#onGotInfo():', data);
    }

    if (!data || !data.success || !data.res) {
      return;
    }

    const info = data.res as Record<string, any>;

    for (const category in info) {
      if (category === 'features') {
        continue;
      }

      for (const key in info[category]) {
        if (!info[category].hasOwnProperty(key)) {
          continue;
        }

        const path = `${category}.${key}`;

        let val: any = info[category][key];

        if (
          val !== undefined &&
          (this.#state[path] === undefined || this.#state[path] !== val)
        ) {
          this.#state[path as keyof EventTypes] = val;

          try {
            val = JSON.parse(val);
          } catch (e) { }

          this.emit(path, { path, val });
          this.emit('*', { path, val });
        }
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  #onInfoUpdate(data: any): void {
    if (this.#logging) {
      console.log('LauncherEvents.#onInfoUpdate():', data);
    }

    if (!data || !data.info) {
      return;
    }

    const info = data.info as Record<string, any>;

    for (const category in info) {
      if (!info.hasOwnProperty(category)) {
        continue;
      }

      for (const key in info[category]) {
        if (!info[category].hasOwnProperty(key)) {
          continue;
        }

        const path = `${category}.${key}`;

        let val: any = info[category][key];

        if (
          val !== undefined &&
          (this.#state[path] === undefined || this.#state[path] !== val)
        ) {
          this.#state[path as keyof EventTypes] = val;

          try {
            val = JSON.parse(val);
          } catch (e) { }

          this.emit(path, { path, val });
          this.emit('*', { path, val });
        }
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  #onNewEvent(data: any): void {
    if (this.#logging) {
      console.log('LauncherEvents.#onNewEvent():', data);
    }

    if (!data.events || !data.events.length) {
      return;
    }

    for (const event of data.events) {
      const path = `events.${event.name}`;

      let val: any = event.data;

      if (
        val !== undefined &&
        (this.#state[path] === undefined || this.#state[path] !== val)
      ) {
        this.#state[path as keyof EventTypes] = val;
      }

      try {
        val = JSON.parse(val);
      } catch (e) { }

      this.emit(path, { path, val });
      this.emit('*', { path, val });
    }
  }

  #tryToSetRequiredFeatures():
    Promise<overwolf.games.launchers.events.SetRequiredFeaturesResult> {
    return new Promise(resolve => {
      overwolf.games.launchers.events.setRequiredFeatures(
        this.#launcherID,
        this.#features,
        resolve
      );
    });
  }

  async #setRequiredFeatures(): Promise<boolean> {
    let
      tries = 0,
      result: overwolf.games.launchers.events.SetRequiredFeaturesResult | null =
        null;

    while (tries < this.#retries && this.#launcherStatus.isRunning) {
      result = await this.#tryToSetRequiredFeatures();

      if (result.success) {
        console.log(...log(
          'LauncherEvents.#setRequiredFeatures(): success:',
          result
        ));

        return !!(result.supportedFeatures && result.supportedFeatures.length);
      }

      await delay(2000);
      tries++;
    }

    console.log(
      `LauncherEvents.#setRequiredFeatures(): failure after ${tries + 1} tries:`
      ,
      result
    );

    return false;
  }
}
