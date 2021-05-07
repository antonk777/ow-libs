/// <reference types="@overwolf/types" />
export declare class OverwolfWindow {
    private name;
    private id;
    constructor(name?: string | null);
    get isCurrent(): boolean;
    obtain(): Promise<overwolf.windows.WindowInfo>;
    obtainCurrent(): Promise<overwolf.windows.WindowInfo>;
    obtainByName(): Promise<overwolf.windows.WindowInfo>;
    restore(): Promise<void>;
    minimize(): Promise<void>;
    maximize(): Promise<void>;
    hide(): Promise<void>;
    changeSize(width: number, height: number, autoDpiResize?: boolean): Promise<void>;
    changePosition(left: number, top: number): Promise<void>;
    dragMove(): Promise<overwolf.windows.DragMovedResult>;
    dragResize(edge: overwolf.windows.enums.WindowDragEdge): Promise<void>;
    getWindowState(): Promise<overwolf.windows.GetWindowStateResult>;
    setTopmost(shouldBeTopmost: boolean): Promise<void>;
    sendToBack(): Promise<void>;
    bringToFront(grabFocus: boolean): Promise<void>;
    setPosition(properties: overwolf.windows.SetWindowPositionProperties): Promise<void>;
    isWindowVisibleToUser(): Promise<overwolf.windows.IsWindowVisibleToUserResult>;
    close(): Promise<void>;
    toggle(): Promise<void>;
    setZoom(zoomFactor: number): Promise<void>;
    center(): Promise<void>;
    static getWindowsStates(): Promise<overwolf.windows.GetWindowsStatesResult>;
    static getViewportSize(): Promise<{
        width: number;
        height: number;
    }>;
    static getMonitorsList(): Promise<overwolf.utils.getMonitorsListResult>;
}
declare type OverwolfWindowErrorProps = {
    result: overwolf.Result;
    args?: (null | string | number | boolean | overwolf.windows.SetWindowPositionProperties | overwolf.windows.ChangeWindowSizeParams)[];
};
export declare class OverwolfWindowError extends Error {
    constructor({ result, args }: OverwolfWindowErrorProps);
}
export {};
