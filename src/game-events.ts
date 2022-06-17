import { EventEmitter, Utils } from './';
import type { GameStatus } from './';

export type GameEvent = {
  path: string
  category: string
  key: string
  val: any
}

type GameEventTypes = {
  [key: string]: GameEvent
}

export class GameEvents extends EventEmitter<GameEventTypes> {
  readonly #features: string[]
  readonly #gameStatus: GameStatus

  readonly #state: Record<string, any>
  readonly #retries: number

  #started: boolean
  #startingPromise: Promise<void> | null

  #onErrorBound
  #onInfoUpdateBound
  #onNewEventBound

  constructor(features: string[], gameStatus: GameStatus) {
    super();

    this.#onErrorBound = this.#onError.bind(this);
    this.#onInfoUpdateBound = this.#onInfoUpdate.bind(this);
    this.#onNewEventBound = this.#onNewEvent.bind(this);

    this.#features = features;
    this.#gameStatus = gameStatus;

    this.#state = {};
    this.#retries = 25;

    this.#started = false;
    this.#startingPromise = null;
  }

  /** Copy of current state, both info updates and last event values */
  get state(): Record<string, any> {
    return Utils.objectCopy(this.#state);
  }

  /**
   * Call overwolf.games.events.setRequiredFeatures and bind listeners
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
      overwolf.games.events.getInfo(result => this.#onGotInfo(result));
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
    overwolf.games.events.onInfoUpdates2.removeListener(
      this.#onInfoUpdateBound
    );
    overwolf.games.events.onNewEvents.removeListener(this.#onNewEventBound);
  }

  #setListeners(): void {
    this.#removeListeners();
    overwolf.games.events.onError.addListener(this.#onErrorBound);
    overwolf.games.events.onInfoUpdates2.addListener(this.#onInfoUpdateBound);
    overwolf.games.events.onNewEvents.addListener(this.#onNewEventBound);
  }

  #onError(err: overwolf.games.events.ErrorEvent): void {
    console.log('GameEvents: error:', err);
  }

  /** Wrapper for overwolf.games.events.getInfo */
  getInfo<T>(): Promise<T> {
    return new Promise((resolve, reject) => {
      overwolf.games.events.getInfo((
        data: overwolf.games.events.GetInfoResult
      ) => {
        if (data && data.success && data.res) {
          resolve(data.res);
        } else {
          reject(data);
        }
      });
    });
  }

  #onGotInfo(data: overwolf.games.events.GetInfoResult): void {
    if (!data || !data.success || !data.res) return;

    const info = data.res as Record<string, any>;

    for (const category in info) {
      if (category === 'features') continue;

      for (const key in info[category]) {
        if (!info[category].hasOwnProperty(key)) continue;

        const path = `${category}.${key}`;

        let val = info[category][key];

        if (
          val !== undefined &&
          (this.#state[path] === undefined || this.#state[path] !== val)
        ) {
          this.#state[path] = val;

          try {
            val = JSON.parse(val);
          } catch (e) {}

          const e: GameEvent = { path, category, key, val };

          this.emit(path, e);
          this.emit(`${category}.*`, e);
          this.emit('*', e);
        }
      }
    }
  }

  #onInfoUpdate(data: overwolf.games.events.InfoUpdates2Event): void {
    if (!data || !data.info) return;

    const info = data.info as Record<string, any>;

    for (const category in info) {
      if (!info.hasOwnProperty(category)) continue;

      for (const key in info[category]) {
        if (!info[category].hasOwnProperty(key)) continue;

        const path = `${category}.${key}`;

        let val = info[category][key];

        if (
          val !== undefined &&
          (this.#state[path] === undefined || this.#state[path] !== val)
        ) {
          this.#state[path] = val;

          try {
            val = JSON.parse(val);
          } catch (e) {}

          const e: GameEvent = { path, category, key, val };

          this.emit(path, e);
          this.emit(`${category}.*`, e);
          this.emit('*', e);
        }
      }
    }
  }

  #onNewEvent(data: overwolf.games.events.NewGameEvents): void {
    if (!data.events || !data.events.length) return;

    for (const event of data.events) {
      const
        category = 'events',
        key = event.name,
        path = `${category}.${key}`;

      let val = event.data;

      if (
        val !== undefined &&
        (this.#state[path] === undefined || this.#state[path] !== val)
      ) {
        this.#state[path] = val;
      }

      try {
        val = JSON.parse(val);
      } catch (e) {}

      const e: GameEvent = { path, category, key, val };

      this.emit(path, e);
      this.emit(`${category}.*`, e);
      this.emit('*', e);
    }
  }

  #tryToSetRequiredFeatures(): Promise<
    overwolf.games.events.SetRequiredFeaturesResult
    > {

    return new Promise(resolve => {
      overwolf.games.events.setRequiredFeatures(this.#features, resolve);
    });
  }

  async #setRequiredFeatures(): Promise<boolean> {
    let
      tries = 0,
      result: overwolf.games.events.SetRequiredFeaturesResult | null = null;

    while (tries < this.#retries && this.#gameStatus.isRunning) {
      result = await this.#tryToSetRequiredFeatures();

      if (result.success) {
        console.log(...Utils.L('setRequiredFeatures(): success:', result));
        return !!(result.supportedFeatures && result.supportedFeatures.length);
      }

      await Utils.delay(2000);
      tries++;
    }

    console.log(
      `setRequiredFeatures(): failure after ${tries + 1} tries:`,
      result
    );

    return false;
  }
}
