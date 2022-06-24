type EventListener<EventType> = [EventType] extends [undefined]
  ? () => void
  : (event: EventType) => void

type EventListenerRef = any

type EventListenersMap<EventType> =
  Map<EventListenerRef, EventListener<EventType>>

type EventListenerStore<EventTypes> = {
  [EventName in keyof EventTypes]?: EventListenersMap<EventTypes[EventName]>
}

type EventListenerBundle<EventTypes> = {
  readonly [EventName in keyof EventTypes]?:
  EventListener<EventTypes[EventName]>
}

export class EventEmitter<EventTypes extends Record<string, any>> {
  readonly #listeners: EventListenerStore<EventTypes> = {}

  #isEventListener<EventType>(
    listener: (...any: any[]) => any
  ): listener is EventListener<EventType> {
    return typeof listener === 'function';
  }

  /**
   * Check if there are listeners for event name
   */
  hasListener<EventName extends keyof EventTypes>(
    eventName: EventName
  ): boolean {
    const listenersBundle = this.#listeners[eventName];

    return (listenersBundle && listenersBundle.size > 0);
  }

  /**
   * Emit an event
   * @param eventName Event name
   * @param value Event value that will be passed as an argument to listeners
   */
  emit<EventName extends keyof EventTypes>(...args: (
    EventTypes[EventName] extends undefined
    ? [eventName: EventName, value?: EventTypes[EventName]]
    : [eventName: EventName, value: EventTypes[EventName]]
  )): void {
    const [eventName, value] = args;

    if (!this.hasListener(eventName)) {
      return;
    }

    const listenersBundle = this.#listeners[eventName];

    if (listenersBundle instanceof Map && listenersBundle.size > 0) {
      listenersBundle.forEach(listener => (listener as any)(value));
    }
  }

  /**
   * Add multiple listeners for events
   * @param listenersBundle Map of events to listeners
   * @param ref Reference value that can be used to remove the listeners
   */
  on(
    listenersBundle: EventListenerBundle<EventTypes>,
    ref?: EventListenerRef
  ): void {
    for (const eventName in listenersBundle) {
      if (!listenersBundle.hasOwnProperty(eventName)) {
        continue;
      }

      const listener = listenersBundle[eventName];

      if (
        listener !== undefined &&
        this.#isEventListener<EventTypes[typeof eventName]>(listener)
      ) {
        this.addListener(eventName, listener, ref);
      }
    }
  }

  /**
   * Add a listener to an event
   * @param eventName Event name
   * @param listener Listener function
   * @param ref Reference value that can be used to remove this listener,
   * if omitted it will be the listener itself
   */
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

  /**
   * Remove multiple listeners for events
   * @param eventNames Array of event names
   * @param ref Reference value that map to listeners
   */
  off<EventName extends keyof EventTypes>(
    eventNames: EventName[],
    ref: EventListenerRef
  ): void {
    eventNames.forEach(eventName => this.removeListener(eventName, ref));
  }

  /**
   * Remove a listener to an event
   * @param eventName Event name
   * @param ref Reference value that was used when adding the listener,
   * this can be the listener itself
   */
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
