declare type EventListener = (...args: any[]) => void;
declare type EventListenerRef = any;
declare type EventListenerBundle = {
    [key: string]: EventListener;
};
export declare class EventEmitter {
    private listeners;
    constructor();
    hasListener(key: string): boolean;
    emit<T>(key: string, value?: T): void;
    private _on;
    on(listenerBundle: EventListenerBundle, ref?: EventListenerRef): void;
    on(event: string, listener: EventListener, ref?: EventListenerRef): void;
    private _off;
    off(eventNames: string[], ref: EventListenerRef): void;
    off(ref: EventListenerRef): void;
    once(key: string, listener: EventListener, ref?: EventListenerRef): void;
}
export {};
