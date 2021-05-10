type EventListener<T> = (event?: T) => void
type EventListenerRef = any
type EventListeners<T> = Map<EventListenerRef, EventListener<T>>

export class Event<T> {
  private listeners: EventListeners<T>

  constructor() {
    this.listeners = new Map();
  }

  addListener(
    listener: EventListener<T>,
    ref: EventListenerRef = listener
  ): void {
    this.listeners.set(ref, listener);
  }

  removeListener(ref: EventListenerRef): void {
    this.listeners.delete(ref);
  }

  callListener(event?: T): void {
    for (const [, listener] of this.listeners) {
      listener(event);
    }
  }
}
