/* eslint-disable no-unused-vars */
type EventListener = (...args: any[]) => void
type EventListenerRef = any
type EventListenerStore = {
  [key: string]: Map<EventListenerRef, EventListener>
}
type EventListenerBundle = {
  [key: string]: EventListener
}

export class EventEmitter {
  private listeners: EventListenerStore

  constructor() {
    this.listeners = {};
  }

  hasListener(key: string): boolean {
    return !!(this.listeners[key] && this.listeners[key].size > 0);
  }

  emit<T>(key: string, value?: T): void {
    if (this.hasListener(key)) {
      for (const [, listener] of this.listeners[key]) {
        if (listener) {
          listener(value);
        }
      }
    }
  }

  private _on(
    key: string,
    listener: EventListener,
    ref?: EventListenerRef
  ): void {
    if (typeof listener !== 'function') {
      throw new Error('EventListener is not a function');
    }

    const { listeners } = this;

    if (!listeners[key]) {
      listeners[key] = new Map();
    }

    listeners[key].set((ref !== undefined) ? ref : listener, listener);
  }

  on(listenerBundle: EventListenerBundle, ref?: EventListenerRef): void
  on(
    event: string,
    listener: EventListener,
    ref?: EventListenerRef
  ): void

  on(
    eventOrBundle: string | EventListenerBundle,
    refOrListener?: EventListener | EventListenerRef,
    ref?: EventListenerRef
  ): void {
    if (typeof refOrListener === 'function' && ref !== undefined) {
      this._on(eventOrBundle as string, refOrListener as EventListener, ref);
    } else {
      const listenerBundle = eventOrBundle as EventListenerBundle;

      for (const key in listenerBundle) {
        if (listenerBundle.hasOwnProperty(key)) {
          this._on(key, listenerBundle[key], refOrListener);
        }
      }
    }
  }

  private _off(
    eventOrRef: string | EventListenerRef,
    ref?: EventListenerRef
  ): void {
    const { listeners } = this;

    if (ref === undefined) {
      for (const key in listeners) {
        if (listeners[key] && listeners[key].has(eventOrRef)) {
          listeners[key].delete(eventOrRef);

          if (listeners[key].size === 0) {
            delete listeners[key];
          }
        }
      }
    } else if (listeners[eventOrRef] && listeners[eventOrRef].has(ref)) {
      listeners[eventOrRef].delete(ref);

      if (listeners[eventOrRef].size === 0) {
        delete listeners[eventOrRef];
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

  once(key: string, listener: EventListener, ref?: EventListenerRef): void {
    if (typeof listener !== 'function') {
      throw new Error('listener is not a function');
    }

    const { listeners } = this;

    if (!listeners[key]) {
      listeners[key] = new Map();
    }

    if (ref === undefined) {
      throw new Error('once listener ref cannot be undefined');
    }

    listeners[key].set(ref, value => {
      listener(value);
      this._off(key, ref);
    });
  }
}
