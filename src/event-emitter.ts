type EventListener<EventType> = (event: EventType) => void

type EventListenerRef = any

type EventListenersMap<EventType> =
  Map<EventListenerRef, EventListener<EventType>>

type EventListenerStore<EventTypes> = {
  [EventName in keyof EventTypes]?:
    EventListenersMap<EventTypes[EventName]>
}

type EventListenerBundle<EventTypes> = {
  readonly [EventName in keyof EventTypes]?:
    EventListener<EventTypes[EventName]>
}

export class EventEmitter<EventTypes extends Record<string, any>> {
  readonly #listeners: EventListenerStore<EventTypes> = {}

  private _isEventListener<EventType>(
    listener: any
  ): listener is EventListener<EventType> {
    return typeof listener === 'function';
  }

  hasListener<EventName extends keyof EventTypes>(key: EventName): boolean {
    const listenersBundle = this.#listeners[key];

    return (listenersBundle && listenersBundle.size > 0);
  }

  protected emit<EventName extends keyof EventTypes>(
    key: EventName,
    value: EventTypes[EventName]
  ): void {
    if (!this.hasListener(key)) {
      return;
    }

    const listenersBundle = this.#listeners[key];

    if (listenersBundle instanceof Map && listenersBundle.size > 0) {
      listenersBundle.forEach(listener => listener(value));
    }
  }

  on(
    listenersBundle: EventListenerBundle<EventTypes>,
    ref: EventListenerRef
  ): void {
    for (const eventName in listenersBundle) {
      if (!listenersBundle.hasOwnProperty(eventName)) continue;

      const listener = listenersBundle[eventName];

      if (this._isEventListener<EventTypes[typeof eventName]>(listener)) {
        this.addListener(eventName, listener, ref);
      }
    }
  }

  addListener<EventName extends keyof EventTypes>(
    eventName: EventName,
    listener: EventListener<EventTypes[EventName]>,
    ref: EventListenerRef = listener
  ): void {
    if (this.#listeners[eventName] === undefined) {
      this.#listeners[eventName] = new Map();
    }

    (this.#listeners[eventName] as EventListenersMap<EventTypes[EventName]>)
      .set(ref, listener);
  }

  off<EventName extends keyof EventTypes>(
    eventNames: EventName[],
    ref: EventListenerRef
  ): void {
    eventNames.forEach(eventName => this.removeListener(eventName, ref));
  }

  // offByRef(ref: EventListenerRef): void {
  //   Object.keys(this.#listeners).forEach(eventName => {
  //     this.removeListener(eventName, ref);
  //   });
  // }

  removeListener<EventName extends keyof EventTypes>(
    eventName: EventName,
    ref: EventListenerRef
  ): void {
    const listenersBundle = this.#listeners[eventName];

    if (listenersBundle !== undefined && listenersBundle.has(ref)) {
      listenersBundle.delete(ref);

      if (listenersBundle.size === 0) {
        delete this.#listeners[eventName];
      }
    }
  }
}
