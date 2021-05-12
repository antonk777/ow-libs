/* eslint-disable no-unused-vars */
type EventListener<T> = (event?: T) => void
type EventListenerRef = any
type EventListenerStore<T> = {
  [key: string]: Map<EventListenerRef, EventListener<T>>
}
type EventListenerBundle<T> = {
  [key: string]: EventListener<T>
}

export class EventEmitter<T> {
  readonly #listeners: EventListenerStore<T> = {}

  hasListener(key: string): boolean {
    return !!(this.#listeners[key] && this.#listeners[key].size > 0);
  }

  emit(key: string, value?: T): void {
    if (this.hasListener(key)) {
      for (const [, listener] of this.#listeners[key]) {
        if (value === undefined) {
          listener();
        } else {
          listener(value);
        }
      }
    }
  }

  private _on(
    key: string,
    listener: EventListener<T>,
    ref: EventListenerRef = listener
  ): void {
    if (!this.#listeners[key]) {
      this.#listeners[key] = new Map();
    }

    this.#listeners[key].set(ref, listener);
  }

  on(
    listenerBundle: EventListenerBundle<T>,
    ref?: EventListenerRef
  ): void

  on(
    eventName: string,
    listener: EventListener<T>,
    ref?: EventListenerRef
  ): void

  on(
    eventNameOrBundle: string | EventListenerBundle<T>,
    refOrListener?: EventListener<T> | EventListenerRef,
    ref?: EventListenerRef
  ): void {
    if (typeof refOrListener === 'function' && ref !== undefined) {
      this._on(
        eventNameOrBundle as string,
        refOrListener as EventListener<T>,
        ref
      );
    } else {
      const listenerBundle = eventNameOrBundle as EventListenerBundle<T>;

      for (const key in listenerBundle) {
        if (listenerBundle.hasOwnProperty(key)) {
          this._on(key, listenerBundle[key], refOrListener);
        }
      }
    }
  }

  private _off(
    eventNameOrRef: string | EventListenerRef,
    ref?: EventListenerRef
  ): void {
    if (ref === undefined) {
      for (const key in this.#listeners) {
        if (this.#listeners[key] && this.#listeners[key].has(eventNameOrRef)) {
          this.#listeners[key].delete(eventNameOrRef);

          if (this.#listeners[key].size === 0) {
            delete this.#listeners[key];
          }
        }
      }
    } else if (
      this.#listeners[eventNameOrRef] &&
      this.#listeners[eventNameOrRef].has(ref)
    ) {
      this.#listeners[eventNameOrRef].delete(ref);

      if (this.#listeners[eventNameOrRef].size === 0) {
        delete this.#listeners[eventNameOrRef];
      }
    }
  }

  off(eventNames: string[], ref: EventListenerRef): void
  off(ref: EventListenerRef): void

  off(
    eventNamesOrRef: string[] | EventListenerRef,
    ref?: EventListenerRef
  ): void {
    if (Array.isArray(eventNamesOrRef)) {
      for (const key of eventNamesOrRef) {
        this._off(key, ref);
      }
    } else {
      this._off(eventNamesOrRef);
    }
  }
}
