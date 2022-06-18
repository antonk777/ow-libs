import { EventEmitter, Utils, WindowTunnel } from '.';

interface StateSubscription<StateMap> {
  readonly on: EventEmitter<StateMap>['on'];
  readonly off: EventEmitter<StateMap>['off'];
  readonly addListener: EventEmitter<StateMap>['addListener'];
  readonly removeListener: EventEmitter<StateMap>['removeListener'];
}

export type State<T> = T & StateSubscription<T>;

function makeGlobalStateManagerName(name: string): string {
  return `OverwolfAppGlobalStateManager/${name}`;
}

function hydratePersistentState<StateMapT extends Record<string, any>>(
  initialState: StateMapT,
  prefix: string
): StateMapT {
  const
    state = Utils.objectCopy(initialState),
    prefixLength = prefix.length;

  for (const key in localStorage) {
    if (key.length > prefixLength && key.startsWith(prefix)) {
      const
        stateKey = key.substr(prefixLength),
        stored = localStorage.getItem(key);

      if (typeof stored === 'string' && stored !== 'undefined') {
        (state as Record<string, any>)[stateKey] = JSON.parse(stored);
      }
    }
  }

  return state;
}

export class StateManager<
  StateMapT extends Record<string, any>
  > extends EventEmitter<StateMapT> {

  readonly globalName: string;
  readonly #persistent: boolean;
  readonly #localStoragePrefix: string;

  #state: StateMapT;

  constructor(
    globalName: string,
    initialState: StateMapT,
    persistent = false
  ) {
    super();

    this.globalName = globalName;
    this.#persistent = persistent;
    this.#localStoragePrefix = `${globalName}/`;

    if (this.#persistent) {
      this.#state = hydratePersistentState<StateMapT>(
        initialState,
        this.#localStoragePrefix
      );
    } else {
      this.#state = Utils.objectCopy(initialState);
    }

    WindowTunnel.set(makeGlobalStateManagerName(globalName), this);
  }

  has(key: string): boolean {
    return this.#state[key] !== undefined;
  }

  get<Key extends keyof StateMapT>(key: Key): StateMapT[Key] {
    const value = this.#state[key];

    if (typeof value === 'object' && value !== null) {
      return Utils.objectCopy(value);
    }

    return value;
  }

  #setObject<Key extends keyof StateMapT>(
    key: Key,
    value: StateMapT[Key]
  ): void {
    const stringified = JSON.stringify(value);

    if (this.#persistent) {
      localStorage.setItem(this.#localStoragePrefix + key, stringified);
    }

    const copy = JSON.parse(stringified) as StateMapT[Key];

    this.#state[key] = copy;
    this.emit(key, copy);
  }

  #setPrimitive<Key extends keyof StateMapT>(
    key: Key,
    value: StateMapT[Key]
  ): void {
    if (this.#persistent) {
      localStorage.setItem(
        this.#localStoragePrefix + key,
        JSON.stringify(value)
      );
    }

    this.#state[key] = value;
    this.emit(key, value);
  }

  set<Key extends keyof StateMapT>(key: Key, value: StateMapT[Key]): void {
    if (typeof value === 'object' && value !== null) {
      this.#setObject(key, value);
    } else {
      this.#setPrimitive(key, value);
    }
  }

  replaceState(state: StateMapT): void {
    this.#state = Utils.objectCopy(state);
  }

  clearPersistentState(): void {
    for (const key in this.#state) {
      if (this.#state.hasOwnProperty(key)) {
        localStorage.removeItem(this.#localStoragePrefix + key);
      }
    }
  }
}

/** Read-only wrapper of the StateManager */
export class StateClient<StateMapT extends Record<string, any>> {
  readonly globalName: string;

  readonly #stateManager

  constructor(globalName: string) {
    this.globalName = globalName;

    this.#stateManager = WindowTunnel.get<StateManager<StateMapT>>(
      makeGlobalStateManagerName(globalName)
    );

    if (!this.#stateManager) {
      throw new Error(
        'StateManager server not defined in background (main) window'
      );
    }

    this.addListener = this.#stateManager.addListener.bind(this.#stateManager);
    this.on = this.#stateManager.on.bind(this.#stateManager);
    this.off = this.#stateManager.off.bind(this.#stateManager);
    this.removeListener =
      this.#stateManager.removeListener.bind(this.#stateManager);
    this.has = this.#stateManager.has.bind(this.#stateManager);
    this.get = this.#stateManager.get.bind(this.#stateManager);
  }

  readonly addListener
  readonly on
  readonly off
  readonly removeListener
  readonly has
  readonly get
}

export function makeNiceState<StateMapT extends Record<string, any>>(
  manager: StateManager<StateMapT>
): State<StateMapT> {
  const proxyHandler: ProxyHandler<StateManager<StateMapT>> = {
    has(target, key: string) {
      return target.has(key);
    },
    get(target, key: string) {
      switch (key) {
        case 'on':
          return target.on.bind(target);
        case 'off':
          return target.off.bind(target);
        case 'addListener':
          return target.addListener.bind(target);
        case 'removeListener':
          return target.removeListener.bind(target);
        default:
          return target.get(key);
      }
    },
    set(target, key: string, value: any) {
      switch (key) {
        case 'on':
        case 'off':
        case 'addListener':
        case 'removeListener':
          throw new Error(`"${key}" is a reserved property for State`);
      }

      target.set(key, value);

      return true;
    },
    deleteProperty() {
      throw new Error('Deleting properties is not allowed for State');
    },
    ownKeys() {
      return [];
    }
  };

  return new Proxy<StateManager<StateMapT>>(
    manager,
    proxyHandler
  ) as unknown as State<StateMapT>;
}

export function makeNiceStateClient<StateMapT extends Record<string, any>>(
  globalName: string
): State<StateMapT> {
  const client = new StateClient<StateMapT>(globalName);

  const proxyHandler: ProxyHandler<StateClient<StateMapT>> = {
    has(target, key: string) {
      return target.has(key);
    },
    get(target, key: string) {
      switch (key) {
        case 'on':
          return target.on.bind(target);
        case 'off':
          return target.off.bind(target);
        case 'addListener':
          return target.addListener.bind(target);
        case 'removeListener':
          return target.removeListener.bind(target);
        default:
          return target.get(key);
      }
    },
    set() {
      throw new Error('Setting properties is not allowed for StateClient');
    },
    deleteProperty() {
      throw new Error('Deleting properties is not allowed for StateClient');
    },
    ownKeys() {
      return [];
    }
  };

  return new Proxy<StateClient<StateMapT>>(
    client,
    proxyHandler
  ) as unknown as State<StateMapT>;
}
