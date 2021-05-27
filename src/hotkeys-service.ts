import { binder } from './binder';
import { SingleEvent } from './single-event';

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

export class HotkeyService {
  #hotkeys: HotkeyStore = {};
  #bound = binder<HotkeyService>(this);
  public readonly onHotkeyChanged = new SingleEvent<HotkeyChangedEvent>();
  public readonly onHotkeyPressed = new SingleEvent<HotkeyName>();

  public getHotkeyBinding(hotkeyName: string, gameId: number): string | null {
    if (this.#hotkeys[hotkeyName]) {
      if (
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

  public async start(): Promise<void> {
    overwolf.settings.hotkeys.onChanged
      .addListener(this.#bound.handleHotkeyChanged);

    overwolf.settings.hotkeys.onPressed
      .addListener(this.#bound.handleHotkeyPressed);

    await this.updateHotkeys();

    for (const name in this.#hotkeys) {
      if (this.#hotkeys.hasOwnProperty(name)) {
        this.onHotkeyChanged.callListener({
          name,
          binding: this.#hotkeys[name].global
        });

        for (const gameIdStr in this.#hotkeys[name].games) {
          if (this.#hotkeys[name].games.hasOwnProperty(name)) {
            const gameId = parseInt(gameIdStr, 10);

            this.onHotkeyChanged.callListener({
              name,
              gameId,
              binding: this.#hotkeys[name].games[gameIdStr]
            });
          }
        }
      }
    }
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
      if (this.#hotkeys[hotkey.name]) {
        this.#hotkeys[hotkey.name].global = hotkey.binding;
      } else {
        this.#hotkeys[hotkey.name] = {
          global: hotkey.binding,
          games: {}
        };
      }
    }

    if (hotkeysResult.games !== undefined) {
      for (const gameId in hotkeysResult.games) {
        if (hotkeysResult.games.hasOwnProperty(gameId)) {
          for (const hotkey of hotkeysResult.games[gameId]) {
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
    console.log('HotkeyService.handleHotkeyChanged():', event);

    if (event.gameId === 0) {
      this.#hotkeys[event.name].global = event.binding;
    } else if (this.#hotkeys.games !== undefined) {
      this.#hotkeys[event.name].games[event.gameId] = event.binding;
    }

    const publicEvent: HotkeyChangedEvent = {
      name: event.name,
      binding: event.binding
    };

    if (event.gameId !== 0) {
      publicEvent.gameId = event.gameId;
    }

    this.onHotkeyChanged.callListener(publicEvent);
  }

  private handleHotkeyPressed(
    event: overwolf.settings.hotkeys.OnPressedEvent
  ): void {
    console.log('HotkeyService.handleHotkeyPressed()', event.name);

    this.onHotkeyPressed.callListener(event.name);
  }
}
