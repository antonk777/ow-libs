/* global overwolf*/

import { binder } from './binder';
import { SingleEvent } from './single-event';

export class GameStatus {
  public isInFocus: boolean
  public isRunning: boolean
  public gameInfo: overwolf.games.RunningGameInfo | null

  public readonly onFocusChanged: SingleEvent<boolean>
  public readonly onRunningChanged: SingleEvent<boolean>

  public readonly onResolutionChanged:
    SingleEvent<overwolf.games.RunningGameInfo>

  public readonly onGameChanged:
    SingleEvent<overwolf.games.RunningGameInfo | null>

  public readonly onChanged: SingleEvent<GameStatus>

  #lastGameID: number | null
  #started: boolean
  readonly #startPromise: Promise<void>
  readonly #bound: GameStatus

  constructor() {
    this.isInFocus = false;
    this.isRunning = false;
    this.gameInfo = null;

    this.#lastGameID = null;
    this.#started = false;
    this.#startPromise = this.start();
    this.#bound = binder<GameStatus>(this);

    this.onFocusChanged = new SingleEvent();
    this.onRunningChanged = new SingleEvent();
    this.onResolutionChanged = new SingleEvent();
    this.onGameChanged = new SingleEvent();
    this.onChanged = new SingleEvent();
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
      this.onFocusChanged.callListener(isInFocus);
    }

    if (isRunningChanged) {
      this.onRunningChanged.callListener(isInFocus);
    }

    if (e && e.gameInfo && e.resolutionChanged) {
      this.onResolutionChanged.callListener(e.gameInfo);
    }

    if (e.gameChanged) {
      if (e && e.gameInfo) {
        this.onGameChanged.callListener(e.gameInfo);
      } else {
        this.onGameChanged.callListener(null);
      }
    }

    if (
      isInFocusChanged ||
      isRunningChanged ||
      e.resolutionChanged ||
      e.gameChanged
    ) {
      this.onChanged.callListener(this);
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
