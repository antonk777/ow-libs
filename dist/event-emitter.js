export class EventEmitter {
    constructor() {
        this.listeners = {};
    }
    hasListener(key) {
        return !!(this.listeners[key] && this.listeners[key].size > 0);
    }
    emit(key, value) {
        if (this.hasListener(key)) {
            for (const [, listener] of this.listeners[key]) {
                if (listener) {
                    listener(value);
                }
            }
        }
    }
    _on(key, listener, ref) {
        if (typeof listener !== 'function') {
            throw new Error('EventListener is not a function');
        }
        const { listeners } = this;
        if (!listeners[key]) {
            listeners[key] = new Map();
        }
        listeners[key].set((ref !== undefined) ? ref : listener, listener);
    }
    on(eventOrBundle, refOrListener, ref) {
        if (typeof refOrListener === 'function' && ref !== undefined) {
            this._on(eventOrBundle, refOrListener, ref);
        }
        else {
            const listenerBundle = eventOrBundle;
            for (const key in listenerBundle) {
                if (listenerBundle.hasOwnProperty(key)) {
                    this._on(key, listenerBundle[key], refOrListener);
                }
            }
        }
    }
    _off(eventOrRef, ref) {
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
        }
        else if (listeners[eventOrRef] && listeners[eventOrRef].has(ref)) {
            listeners[eventOrRef].delete(ref);
            if (listeners[eventOrRef].size === 0) {
                delete listeners[eventOrRef];
            }
        }
    }
    off(eventNamesOrRef, ref) {
        if (Array.isArray(eventNamesOrRef)) {
            for (const key of eventNamesOrRef) {
                this._off(key, ref);
            }
        }
        else {
            this._off(eventNamesOrRef);
        }
    }
    once(key, listener, ref) {
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
//# sourceMappingURL=event-emitter.js.map