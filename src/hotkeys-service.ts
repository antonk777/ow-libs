import { EventEmitter } from './event-emitter';
import { L } from './utils';

type GetAssignedHotkeyResult = overwolf.settings.hotkeys.GetAssignedHotkeyResult

type HotkeyBindings = {
  global: string;
  games: { [gameId: string]: string };
}

type HotkeyStore = { [hotkeyName: string]: HotkeyBindings }

export type HotkeyChangedEvent = {
  name: string;
  binding: string;
  gameId?: number;
}

export type HotkeyName = string;

type HotkeyEventTypes = {
  changed: HotkeyChangedEvent,
  pressed: HotkeyName
}

export class HotkeyService extends EventEmitter<HotkeyEventTypes> {
  #hotkeys: HotkeyStore;

  #started: boolean
  #startingPromise: Promise<void> | null

  #onHotkeyChangedBound
  #onHotkeyPressedBound

  constructor() {
    super();

    this.#onHotkeyChangedBound = this.#onHotkeyChanged.bind(this);
    this.#onHotkeyPressedBound = this.#onHotkeyPressed.bind(this);

    this.#hotkeys = {};

    this.#started = false;
    this.#startingPromise = null;
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
    this.destroy();

    overwolf.settings.hotkeys.onChanged.addListener(this.#onHotkeyChangedBound);
    overwolf.settings.hotkeys.onPressed.addListener(this.#onHotkeyPressedBound);

    await this.#updateHotkeys();

    for (const name in this.#hotkeys) {
      if (this.#hotkeys.hasOwnProperty(name)) {
        this.emit('changed', {
          name,
          binding: this.#hotkeys[name].global
        });

        for (const gameIdStr in this.#hotkeys[name].games) {
          if (this.#hotkeys[name].games.hasOwnProperty(name)) {
            const gameId = parseInt(gameIdStr, 10);

            this.emit('changed', {
              name,
              gameId,
              binding: this.#hotkeys[name].games[gameIdStr]
            });
          }
        }
      }
    }

    this.#started = true;
  }

  /** Remove all listeners */
  destroy(): void {
    overwolf.settings.hotkeys.onChanged
      .removeListener(this.#onHotkeyChangedBound);

    overwolf.settings.hotkeys.onPressed
      .removeListener(this.#onHotkeyPressedBound);

    this.#started = false;
  }

  getHotkeyBinding(hotkeyName: string, gameId?: number): string {
    if (this.#hotkeys[hotkeyName]) {
      if (
        typeof gameId === 'number' &&
        this.#hotkeys[hotkeyName].games &&
        this.#hotkeys[hotkeyName].games[gameId]
      ) {
        return this.#hotkeys[hotkeyName].games[gameId];
      }

      if (this.#hotkeys[hotkeyName].global) {
        return this.#hotkeys[hotkeyName].global;
      }
    }

    console.warn(
      'HotkeyService.getHotkeyBinding(): failed:',
      hotkeyName,
      gameId
    );
    console.warn(...L(this.#hotkeys));

    return '';
  }

  #getHotkeys(): Promise<GetAssignedHotkeyResult> {
    return new Promise<GetAssignedHotkeyResult>((resolve, reject) => {
      overwolf.settings.hotkeys.get(results => {
        if (results.success) {
          resolve(results);
        } else {
          reject(new Error(results.error));
        }
      });
    });
  }

  async #updateHotkeys(): Promise<void> {
    const hotkeysResult = await this.#getHotkeys();

    for (const hotkey of hotkeysResult.globals) {
      if (!this.#hotkeys[hotkey.name]) {
        this.#hotkeys[hotkey.name] = {
          global: hotkey.binding,
          games: {}
        };
      } else {
        this.#hotkeys[hotkey.name].global = hotkey.binding;
      }
    }

    if (hotkeysResult.games === undefined) {
      return;
    }

    for (const gameId in hotkeysResult.games) {
      if (!hotkeysResult.games.hasOwnProperty(gameId)) {
        continue;
      }

      for (const hotkey of hotkeysResult.games[gameId]) {
        if (!this.#hotkeys[hotkey.name]) {
          this.#hotkeys[hotkey.name] = {
            global: '',
            games: {}
          };
        }

        if (!this.#hotkeys[hotkey.name].games) {
          this.#hotkeys[hotkey.name].games = {};
        }

        this.#hotkeys[hotkey.name].games[gameId] = hotkey.binding;
      }
    }
  }

  #onHotkeyChanged(event: overwolf.settings.hotkeys.OnChangedEvent): void {
    if (event.gameId === 0) {
      this.#hotkeys[event.name].global = event.binding;
    } else if (this.#hotkeys[event.name].games !== undefined) {
      this.#hotkeys[event.name].games[event.gameId] = event.binding;
    }

    const publicEvent: HotkeyChangedEvent = {
      name: event.name,
      binding: event.binding
    };

    if (event.gameId !== 0) {
      publicEvent.gameId = event.gameId;
    }

    this.emit('changed', publicEvent);
  }

  #onHotkeyPressed(event: overwolf.settings.hotkeys.OnPressedEvent): void {
    this.emit('pressed', event.name);
  }

  /**
   * Wrapper for overwolf.settings.hotkeys.assign
   * @see https://overwolf.github.io/docs/api/overwolf-settings-hotkeys#assignhotkey-callback
   */
  assignHotkey(
    assignHotkey: overwolf.settings.hotkeys.AssignHotkeyObject
  ): Promise<overwolf.Result> {
    return new Promise(resolve => {
      overwolf.settings.hotkeys.assign(assignHotkey, resolve);
    });
  }

  /**
   * Wrapper for overwolf.settings.hotkeys.unassign
   * @see https://overwolf.github.io/docs/api/overwolf-settings-hotkeys#unassignhotkey-callback
   */
  unassignHotkey(
    unassignHotkey: overwolf.settings.hotkeys.UnassignHotkeyObject
  ): Promise<overwolf.Result> {
    return new Promise(resolve => {
      overwolf.settings.hotkeys.unassign(unassignHotkey, resolve);
    });
  }
}
