type EventListener<T> = (event?: T) => void
type EventListenerRef = any
type EventListeners<T> = Map<EventListenerRef, EventListener<T>>

export class SingleEvent<T> {
  readonly #listeners: EventListeners<T> = new Map();

  addListener(
    listener: EventListener<T>,
    ref: EventListenerRef = listener
  ): void {
    this.#listeners.set(ref, listener);
  }

  removeListener(ref: EventListenerRef): void {
    this.#listeners.delete(ref);
  }

  callListener(event?: T): void {
    for (const [, listener] of this.#listeners) {
      listener(event);
    }
  }
}
