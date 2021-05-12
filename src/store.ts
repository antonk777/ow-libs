/* global overwolf */

import { EventEmitter, Utils } from './';

type MapByString = {
  [key: string]: any
}

interface StateSubscription<T> {
  on: EventEmitter<T>['on']
  off: EventEmitter<T>['off']
}

export type State<T> = T & StateSubscription<T>

class StateManager<T extends MapByString> extends EventEmitter<T> {
  readonly name: string
  readonly #state: T
  readonly #persistent: boolean
  readonly #localStoragePrefix: string

  constructor(name: string, initialState: T, persistent = false) {
    super();

    this.name = name;
    this.#persistent = persistent;
    this.#localStoragePrefix = `${name}/`;

    if (this.#persistent) {
      this.#state = StateManager.hydratePersistentState<T>(
        initialState,
        this.#localStoragePrefix
      );
    } else {
      this.#state = Utils.objectCopy<T>(initialState);
    }
  }

  keys(): string[] {
    return Object.keys(this.#state);
  }

  has(key: string): boolean {
    return (this.#state[key] !== undefined);
  }

  get(key: string): void {
    const value = this.#state[key];

    if (typeof value === 'string' && value !== undefined) {
      return StateManager.fastParse(value);
    }

    return value;
  }

  set(key: string, value: any): void {
    if (!(this.#state as MapByString).hasOwnProperty(key)) {
      throw new Error(`Property ${key} does not exist in state`);
    }

    const shallBeStringified = StateManager.shouldBeStringified(value);

    const stringified = (shallBeStringified || this.#persistent)
      ? StateManager.fastStringify(value)
      : undefined;

    (this.#state as MapByString)[key] = shallBeStringified
      ? stringified
      : value;

    if (this.#persistent) {
      localStorage[this.#localStoragePrefix + key] = stringified;
    }

    this.emit(key, this.#state);
    this.emit('*', this.#state);
  }

  private static hydratePersistentState<T>(initialState: T, prefix: string): T {
    const
      state = Utils.objectCopy<T>(initialState),
      prefixLength = prefix.length;

    for (const key in localStorage) {
      if (
        key.length > prefixLength &&
        key.startsWith(prefix)
      ) {
        const
          stringified: string = localStorage[key],
          stateKey = key.substr(prefixLength),
          value = StateManager.fastParse(localStorage[key]);

        if (StateManager.shouldBeStringified(value)) {
          (state as MapByString)[stateKey] = stringified;
        } else {
          (state as MapByString)[stateKey] = value;
        }
      }
    }

    return state;
  }

  private static fastParse(val?: string): any {
    switch (val) {
      case 'true':
        return true;
      case 'false':
        return false;
      case 'null':
        return null;
      case 'undefined':
      case undefined:
        return undefined;
      default:
        return JSON.parse(val);
    }
  }

  private static fastStringify(val: any): string {
    switch (val) {
      case true:
        return 'true';
      case false:
        return 'false';
      case null:
        return 'null';
      case undefined:
        return 'undefined';
      default:
        return JSON.stringify(val);
    }
  }

  private static shouldBeStringified(val: any): boolean {
    const type = typeof val;
    return (type === 'string' || (type === 'object' && val !== null));
  }
}

function makeGlobalStateName(name: string): string {
  return `OverwolfGlobalState/${name}`;
}

export function makeState<T extends MapByString>
(name: string, initialState: T, persistent = false): State<T> {
  const manager = new StateManager(name, initialState, persistent);

  const store = new Proxy<StateManager<T>>(manager, {
    has(target, key: string) {
      return target.has(key);
    },
    get(target, key: string) {
      switch (key) {
        case 'on':
          return target.on.bind(target);
        case 'off':
          return target.off.bind(target);
        default:
          return target.get(key);
      }
    },
    set(target, key: string, value: any) {
      switch (key) {
        case 'on':
        case 'off':
          throw new Error(`${key} is a reserved property for Store`);
      }

      target.set(key, value);

      return true;
    },
    deleteProperty() {
      return false;
    },
    ownKeys() {
      return [];
    }
  });

  (window as MapByString)[makeGlobalStateName(name)] = store;

  return store as unknown as State<T>;
}

export function makeStateClient<T>(name: string): State<T> {
  const win = overwolf.windows.getMainWindow() as MapByString;

  return win[makeGlobalStateName(name)] as State<T>;
}
