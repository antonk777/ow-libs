/* global overwolf*/

import { binder } from './binder';
import { GameStatus, EventEmitter, Utils } from './';

export interface GameEvent {
  path: string
  category: string
  key: string
  val: any
}

export class GameEvents extends EventEmitter {
  private features: string[]
  // private featuresSet: string[] | null
  private state: { [key: string]: any }
  private retries: number
  private bound: GameEvents

  constructor(features: string[]) {
    super();

    this.features = features;
    // this.featuresSet = null;
    this.state = {};
    this.retries = 60;

    this.bound = binder<GameEvents>(this);

    overwolf.games.events.onError.addListener(this.bound.onError);
  }

  destroy(): void {
    this.removeListeners();
    overwolf.games.events.onError.removeListener(this.bound.onError);
  }

  async start(gameStatus: GameStatus): Promise<void> {
    this.stop();

    const result = await this.setRequiredFeatures(gameStatus);

    if (result) {
      overwolf.games.events.getInfo(this.bound.onGotInfo);
      this.setListeners();
    }
  }

  stop(): void {
    this.state = {};
    this.removeListeners();
  }

  removeListeners(): void {
    overwolf.games.events.onInfoUpdates2
      .removeListener(this.bound.onInfoUpdate);
    overwolf.games.events.onNewEvents.removeListener(this.bound.onNewEvent);
  }

  setListeners(): void {
    overwolf.games.events.onInfoUpdates2.addListener(this.bound.onInfoUpdate);
    overwolf.games.events.onNewEvents.addListener(this.bound.onNewEvent);
  }

  onError(err: overwolf.games.events.ErrorEvent): void {
    console.log('gameEvents: error:', err);
  }

  onGotInfo(data: overwolf.games.events.GetInfoResult): void {
    if (!data || !data.success || !data.res) return;

    const info = data.res as Record<string | number, any>;

    for (const category in info) {
      if (category === 'features') continue;

      for (const key in info[category]) {
        if (info[category].hasOwnProperty(key)) {
          const path = `${category}.${key}`;

          let val = info[category][key];

          if (
            val !== undefined &&
            (this.state[path] === undefined || this.state[path] !== val)
          ) {
            this.state[path] = val;

            try {
              val = JSON.parse(val);
            } catch (e) {
              console.log('onGotInfo(): JSON parsing error:', e);
            }

            const e: GameEvent = { path, category, key, val };

            this.emit<GameEvent>('*', e);
            this.emit<GameEvent>(path, e);
          }
        }
      }
    }
  }

  onInfoUpdate(data: overwolf.games.events.InfoUpdates2Event): void {
    if (!data || !data.info) return;

    const info = data.info as Record<string | number, any>;

    for (const category in info) {
      if (info.hasOwnProperty(category)) {
        for (const key in info[category]) {
          if (info[category].hasOwnProperty(key)) {
            const path = `${category}.${key}`;

            let val = info[category][key];

            if (
              val !== undefined &&
              (this.state[path] === undefined || this.state[path] !== val)
            ) {
              this.state[path] = val;

              try {
                val = JSON.parse(val);
              } catch (e) {
                console.log('onInfoUpdate(): JSON parsing error:', e);
              }

              const e: GameEvent = { path, category, key, val };

              this.emit<GameEvent>('*', e);
              this.emit<GameEvent>(path, e);
            }
          }
        }
      }
    }
  }

  onNewEvent(data: overwolf.games.events.NewGameEvents): void {
    if (!data.events || !data.events.length) return;

    for (const event of data.events) {
      const
        category = 'events',
        key = event.name,
        path = `${category}.${key}`;

      let val = event.data;

      if (
        val !== undefined &&
        (this.state[path] === undefined || this.state[path] !== val)
      ) {
        this.state[path] = val;
      }

      try {
        val = JSON.parse(val);
      } catch (e) {
        console.log('onNewEvent(): JSON parsing error:', e);
      }

      const e: GameEvent = { path, category, key, val };

      this.emit<GameEvent>('*', e);
      this.emit<GameEvent>(path, e);
    }
  }

  private setRequiredFeaturesPromise():
  Promise<overwolf.games.events.SetRequiredFeaturesResult> {
    return new Promise(resolve => {
      overwolf.games.events.setRequiredFeatures(this.features, resolve);
    });
  }

  async setRequiredFeatures(gameStatus: GameStatus): Promise<boolean> {
    let tries = 0,
      result: overwolf.games.events.SetRequiredFeaturesResult | null = null;

    while (tries < this.retries && gameStatus.isRunning) {
      result = await this.setRequiredFeaturesPromise();

      if (result.success) {
        console.log(...Utils.L('setRequiredFeatures(): success:', result));
        // this.featuresSet = result.supportedFeatures || null;
        return !!(result.supportedFeatures && result.supportedFeatures.length);
      }

      await Utils.delay(2000);
      tries++;
    }

    // this.featuresSet = null;

    console.log(
      `setRequiredFeatures(): failure after ${tries + 1} tries:`,
      result
    );

    return false;
  }
}
