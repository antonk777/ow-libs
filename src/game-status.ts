import { binder } from './binder';
import { EventEmitter } from './event-emitter';

type GameStatusEventTypes = {
  focus: boolean,
  running: boolean,
  resolutionChanged: overwolf.games.RunningGameInfo | null,
  gameChanged: overwolf.games.RunningGameInfo | null,
  changed: overwolf.games.RunningGameInfo | null,
}

export class GameStatus extends EventEmitter<GameStatusEventTypes> {
  readonly #bound: GameStatus

  public isInFocus: boolean
  public isRunning: boolean
  public gameInfo: overwolf.games.RunningGameInfo | null

  #lastGameID: number | null
  #started: boolean

  readonly #startPromise: Promise<void>

  constructor() {
    super();

    this.#bound = binder<GameStatus>(this);

    this.isInFocus = false;
    this.isRunning = false;
    this.gameInfo = null;

    this.#lastGameID = null;
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

    const gameInfo: overwolf.games.GetRunningGameInfoResult =
      await new Promise(resolve => overwolf.games.getRunningGameInfo(resolve));

    this.setGameInfo(gameInfo);

    this.isInFocus = !!(gameInfo && gameInfo.isInFocus);
    this.isRunning = !!(gameInfo && gameInfo.isRunning);

    overwolf.games.onGameInfoUpdated
      .removeListener(this.#bound.onGameInfoUpdated);

    overwolf.games.onGameInfoUpdated.addListener(this.#bound.onGameInfoUpdated);

    this.#started = true;
  }

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
      this.emit('running', isInFocus);
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
      this.emit('changed', e.gameInfo || null);
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

  gameIs(id: number): boolean {
    return (this.isRunning && this.gameID === id);
  }

  get gameID(): number | null {
    if (this.gameInfo) {
      return Math.floor(this.gameInfo.id / 10);
    }

    return this.#lastGameID;
  }
}
