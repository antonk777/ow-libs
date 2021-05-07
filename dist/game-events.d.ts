/// <reference types="@overwolf/types" />
import { GameStatus, EventEmitter } from './';
export interface GameEvent {
    path: string;
    category: string;
    key: string;
    val: any;
}
export declare class GameEvents extends EventEmitter {
    private features;
    private state;
    private retries;
    private bound;
    constructor(features: string[]);
    destroy(): void;
    start(gameStatus: GameStatus): Promise<void>;
    stop(): void;
    removeListeners(): void;
    setListeners(): void;
    onError(err: overwolf.games.events.ErrorEvent): void;
    onGotInfo(data: overwolf.games.events.GetInfoResult): void;
    onInfoUpdate(data: overwolf.games.events.InfoUpdates2Event): void;
    onNewEvent(data: overwolf.games.events.NewGameEvents): void;
    private setRequiredFeaturesPromise;
    setRequiredFeatures(gameStatus: GameStatus): Promise<boolean>;
}
