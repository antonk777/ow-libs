import { binder } from './binder';
import { EventEmitter } from './event-emitter';

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
  #bound = binder<HotkeyService>(this);

  #hotkeys: HotkeyStore;

  #started: boolean
  readonly #startPromise: Promise<void> | null

  constructor() {
    super();

    this.#bound = binder<HotkeyService>(this);

    this.#hotkeys = {};

    this.#started = false;
    this.#startPromise = this.start();
  }

  async start(): Promise<void> {
    if (this.#started) {
      return;
    }

    if (this.#startPromise) {
      await this.#startPromise;
      return;
    }

    overwolf.settings.hotkeys.onChanged
      .removeListener(this.#bound.handleHotkeyChanged);

    overwolf.settings.hotkeys.onPressed
      .removeListener(this.#bound.handleHotkeyPressed);

    overwolf.settings.hotkeys.onChanged
      .addListener(this.#bound.handleHotkeyChanged);

    overwolf.settings.hotkeys.onPressed
      .addListener(this.#bound.handleHotkeyPressed);

    await this.updateHotkeys();

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

  destroy(): void {
    overwolf.settings.hotkeys.onChanged
      .removeListener(this.#bound.handleHotkeyChanged);

    overwolf.settings.hotkeys.onPressed
      .removeListener(this.#bound.handleHotkeyPressed);
  }

  getHotkeyBinding(hotkeyName: string, gameId?: number): string | null {
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

    return null;
  }

  private getHotkeys(): Promise<GetAssignedHotkeyResult> {
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

  private async updateHotkeys(): Promise<void> {
    const hotkeysResult = await this.getHotkeys();

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

    if (hotkeysResult.games !== undefined) {
      for (const gameId in hotkeysResult.games) {
        if (hotkeysResult.games.hasOwnProperty(gameId)) {
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
    }
  }

  private handleHotkeyChanged(
    event: overwolf.settings.hotkeys.OnChangedEvent
  ): void {
    // console.log('HotkeyService.handleHotkeyChanged():', event);

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

  private handleHotkeyPressed(
    event: overwolf.settings.hotkeys.OnPressedEvent
  ): void {
    console.log('HotkeyService.handleHotkeyPressed()', event.name, event);

    this.emit('pressed', event.name);
  }

  assignHotkey(
    assignHotkey: overwolf.settings.hotkeys.AssignHotkeyObject
  ): Promise<overwolf.Result> {
    return new Promise(resolve => {
      overwolf.settings.hotkeys.assign(assignHotkey, resolve);
    });
  }

  unassignHotkey(
    unassignHotkey: overwolf.settings.hotkeys.UnassignHotkeyObject
  ): Promise<overwolf.Result> {
    return new Promise(resolve => {
      overwolf.settings.hotkeys.unassign(unassignHotkey, resolve);
    });
  }
}
