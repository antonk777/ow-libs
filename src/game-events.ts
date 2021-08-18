import { binder } from './binder';
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
  readonly #bound: GameEvents

  readonly #features: string[]
  readonly #gameStatus: GameStatus

  readonly #state: Record<string, any>
  readonly #retries: number

  #running: boolean
  #startingPromise: Promise<void> | null

  constructor(features: string[], gameStatus: GameStatus) {
    super();

    this.#bound = binder<GameEvents>(this);

    this.#features = features;
    this.#gameStatus = gameStatus;

    this.#state = {};
    this.#retries = 25;

    this.#running = false;
    this.#startingPromise = null;
  }

  async start(): Promise<void> {
    if (this.#running) {
      return;
    }

    if (this.#startingPromise) {
      return this.#startingPromise;
    }

    this.#startingPromise = this._start();

    await this.#startingPromise;

    this.#startingPromise = null;
  }

  private async _start(): Promise<void> {
    this._stop();

    const success = await this.setRequiredFeatures();

    if (success) {
      overwolf.games.events.getInfo(this.#bound.onGotInfo);
      this.setListeners();
    }
  }

  async stop(): Promise<void> {
    if (!this.#running) {
      return;
    }

    if (this.#startingPromise) {
      await this.#startingPromise;
      this.#startingPromise = null;
    }

    this._stop();
    this.#running = false;
  }

  private _stop(): void {
    for (const key in this.#state) {
      if (this.#state.hasOwnProperty(key)) {
        delete this.#state[key];
      }
    }

    this.removeListeners();
  }

  destroy(): void {
    this.removeListeners();
    this.#running = false;
  }

  private removeListeners(): void {
    overwolf.games.events.onError.removeListener(this.#bound.onError);
    overwolf.games.events.onInfoUpdates2
      .removeListener(this.#bound.onInfoUpdate);
    overwolf.games.events.onNewEvents.removeListener(this.#bound.onNewEvent);
  }

  private setListeners(): void {
    this.removeListeners();
    overwolf.games.events.onError.addListener(this.#bound.onError);
    overwolf.games.events.onInfoUpdates2.addListener(this.#bound.onInfoUpdate);
    overwolf.games.events.onNewEvents.addListener(this.#bound.onNewEvent);
  }

  private onError(err: overwolf.games.events.ErrorEvent): void {
    console.log('GameEvents: error:', err);
  }

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

  private onGotInfo(data: overwolf.games.events.GetInfoResult): void {
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
          } catch (e) {
            console.log('onGotInfo(): JSON parsing error:', e);
          }

          const e: GameEvent = { path, category, key, val };

          this.emit(path, e);
          this.emit('*', e);
        }
      }
    }
  }

  private onInfoUpdate(data: overwolf.games.events.InfoUpdates2Event): void {
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
          } catch (e) {
            console.log('onInfoUpdate(): JSON parsing error:', e);
          }

          const e: GameEvent = { path, category, key, val };

          this.emit(path, e);
          this.emit('*', e);
        }
      }
    }
  }

  private onNewEvent(data: overwolf.games.events.NewGameEvents): void {
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
      } catch (e) {
        console.log('onNewEvent(): JSON parsing error:', e);
      }

      const e: GameEvent = { path, category, key, val };

      this.emit(path, e);
      this.emit('*', e);
    }
  }

  private _setRequiredFeatures():
    Promise<overwolf.games.events.SetRequiredFeaturesResult> {

    return new Promise(resolve => {
      overwolf.games.events.setRequiredFeatures(this.#features, resolve);
    });
  }

  private async setRequiredFeatures(): Promise<boolean> {
    let
      tries = 0,
      result: overwolf.games.events.SetRequiredFeaturesResult | null = null;

    while (tries < this.#retries && this.#gameStatus.isRunning) {
      result = await this._setRequiredFeatures();

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
