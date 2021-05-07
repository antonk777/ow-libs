/// <reference types="@overwolf/types" />
import { EventEmitter } from './';
export declare class LauncherStatus extends EventEmitter {
    isInFocus: boolean;
    launcherInfo: overwolf.games.launchers.LauncherInfo | null;
    private bound;
    private started;
    private startPromise;
    constructor();
    get isRunning(): boolean;
    start(): Promise<void>;
    destroy(): void;
    onLauncherLaunched(info: overwolf.games.launchers.LauncherInfo): void;
    onLauncherTerminated(): void;
    onLauncherInfoUpdated({ info }: overwolf.games.launchers.UpdatedEvent): void;
    get launcherID(): number | null;
}
