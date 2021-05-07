/// <reference types="@overwolf/types" />
import { EventEmitter } from './';
export declare class GameStatus extends EventEmitter {
    isInFocus: boolean;
    isRunning: boolean;
    gameInfo: overwolf.games.RunningGameInfo | null;
    private lastGameID;
    private started;
    private startPromise;
    private bound;
    constructor();
    start(): Promise<void>;
    destroy(): void;
    onGameInfoUpdated(e: overwolf.games.GameInfoUpdatedEvent): void;
    setGameInfo(gameInfo: overwolf.games.RunningGameInfo | null): void;
    gameIs(id: number): boolean;
    get gameID(): number | null;
}
