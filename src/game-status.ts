import { binder } from './binder';
import { EventEmitter } from './event-emitter';

type GameStatusEventTypes = {
  focus: boolean,
  running: boolean,
  resolutionChanged: overwolf.games.RunningGameInfo | null,
  gameChanged: overwolf.games.RunningGameInfo | null,
  '*': overwolf.games.RunningGameInfo | null,
}

export class GameStatus extends EventEmitter<GameStatusEventTypes> {
  readonly #bound: GameStatus

  public isInFocus: boolean
  public isRunning: boolean
  public gameInfo: overwolf.games.RunningGameInfo | null

  #lastGameID: number | null
  #started: boolean

  #startPromise: Promise<void> | null

  constructor() {
    super();

    this.#bound = binder<GameStatus>(this);

    this.isInFocus = false;
    this.isRunning = false;
    this.gameInfo = null;

    this.#lastGameID = null;

    this.#started = false;
    this.#startPromise = null;
  }

  async start(): Promise<void> {
    if (this.#started) {
      return;
    }

    if (!this.#startPromise) {
      this.#startPromise = this._start();
    }

    await this.#startPromise;

    this.#started = true;
  }

  private async _start(): Promise<void> {
    overwolf.games.onGameInfoUpdated
      .removeListener(this.#bound.onGameInfoUpdated);

    overwolf.games.onGameInfoUpdated.addListener(this.#bound.onGameInfoUpdated);

    const gameInfo: overwolf.games.GetRunningGameInfoResult =
      await new Promise(resolve => overwolf.games.getRunningGameInfo(resolve));

    this.setGameInfo(gameInfo);

    this.isInFocus = !!(gameInfo && gameInfo.isInFocus);
    this.isRunning = !!(gameInfo && gameInfo.isRunning);
  }

  /** Remove all listeners */
  destroy(): void {
    overwolf.games.onGameInfoUpdated
      .removeListener(this.#bound.onGameInfoUpdated);
  }

  private onGameInfoUpdated(e: overwolf.games.GameInfoUpdatedEvent): void {
    const
      isInFocus = !!(e && e.gameInfo && e.gameInfo.isInFocus),
      isRunning = !!(e && e.gameInfo && e.gameInfo.isRunning),
      isInFocusChanged = (isInFocus !== this.isInFocus),
      isRunningChanged = (isRunning !== this.isRunning);

    if (e && e.gameInfo) {
      this.setGameInfo(e.gameInfo);
    } else {
      this.setGameInfo(null);
    }

    if (isInFocusChanged) {
      this.isInFocus = isInFocus;
    }

    if (isRunningChanged) {
      this.isRunning = isRunning;
    }

    if (isInFocusChanged) {
      this.emit('focus', isInFocus);
    }

    if (isRunningChanged) {
      this.emit('running', isRunning);
    }

    if (e && e.gameInfo && e.resolutionChanged) {
      this.emit('resolutionChanged', e.gameInfo);
    }

    if (e.gameChanged) {
      this.emit('gameChanged', e.gameInfo || null);
    }

    if (
      isInFocusChanged ||
      isRunningChanged ||
      e.resolutionChanged ||
      e.gameChanged
    ) {
      this.emit('*', e.gameInfo || null);
    }
  }

  private setGameInfo(gameInfo: overwolf.games.RunningGameInfo | null): void {
    if (gameInfo && gameInfo.isRunning) {
      this.gameInfo = gameInfo;
      this.#lastGameID = Math.floor(gameInfo.id / 10);
    } else {
      this.gameInfo = null;
    }
  }

  /** Get gameID of current or last running game */
  get gameID(): number | null {
    if (this.gameInfo) {
      return Math.floor(this.gameInfo.id / 10);
    }

    return this.#lastGameID;
  }
}
