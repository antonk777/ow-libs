import { EventEmitter, Utils, WindowTunnel } from './';

interface StateSubscription<StateMap> {
  on: EventEmitter<StateMap>['on']
  off: EventEmitter<StateMap>['off']
}

export type State<T> = T & StateSubscription<T>

class StateManager<StateMap extends Record<string, any>> extends
  EventEmitter<StateMap> {

  readonly name: string
  // readonly #initialState: StateMap
  readonly #state: StateMap
  readonly #persistent: boolean
  readonly #localStoragePrefix: string

  constructor(name: string, initialState: StateMap, persistent = false) {
    super();

    this.name = name;
    this.#persistent = persistent;
    this.#localStoragePrefix = `${name}/`;
    // this.#initialState = initialState;

    if (this.#persistent) {
      this.#state = StateManager.hydratePersistentState<StateMap>(
        initialState,
        this.#localStoragePrefix
      );
    } else {
      this.#state = Utils.objectCopy<StateMap>(initialState);
    }
  }

  has(key: string): boolean {
    return (this.#state[key] !== undefined);
  }

  get<Key extends keyof StateMap>(key: Key): StateMap[Key] {
    const value = this.#state[key];

    if (typeof value === 'object' && value !== null) {
      return Utils.objectCopy(value);
    }

    return value;
  }

  private _setObject<Key extends keyof StateMap>(
    key: Key,
    value: StateMap[Key]
  ): void {
    const stringified = JSON.stringify(value);

    if (this.#persistent) {
      localStorage[this.#localStoragePrefix + key] = stringified;
    }

    const copy = JSON.parse(stringified) as StateMap[Key];

    this.#state[key] = copy;
    this.emit(key, copy);
  }

  private _setPrimitive<Key extends keyof StateMap>(
    key: Key,
    value: StateMap[Key]
  ): void {
    if (this.#persistent) {
      localStorage[this.#localStoragePrefix + key] = JSON.stringify(value);
    }

    this.#state[key] = value;
    this.emit(key, value);
  }

  set<Key extends keyof StateMap>(key: Key, value: StateMap[Key]): void {
    if (typeof value === 'object' && value !== null) {
      this._setObject(key, value);
    } else {
      this._setPrimitive(key, value);
    }
  }

  private static hydratePersistentState<T extends Record<string, any>>(
    initialState: T,
    prefix: string
  ): T {
    const
      state = Utils.objectCopy<T>(initialState),
      prefixLength = prefix.length;

    for (const key in localStorage) {
      if (key.length > prefixLength && key.startsWith(prefix)) {
        const stateKey = key.substr(prefixLength);

        (state as Record<string, any>)[stateKey] =
          JSON.parse(localStorage[key]);
      }
    }

    return state;
  }
}

function makeGlobalStateName(name: string): string {
  return `GlobalState/${name}`;
}

export function makeState<StateMap extends Record<string, any>>(
  name: string,
  initialState: StateMap,
  persistent = false
): State<StateMap> {
  const manager = new StateManager(name, initialState, persistent);

  const store = new Proxy<StateManager<StateMap>>(manager, {
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
  }) as unknown as State<StateMap>;

  WindowTunnel.set(makeGlobalStateName(name), store);

  return store;
}

export function makeStateClient<StateMap>(name: string): State<StateMap> {
  return WindowTunnel.get<State<StateMap>>(makeGlobalStateName(name));
}
