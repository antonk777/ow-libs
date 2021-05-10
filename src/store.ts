/* global overwolf */

import { EventEmitter, Utils } from './';

type MapByString = {
  [prop: string]: any
}

interface StateSubscription<T> {
  on: EventEmitter<T>['on']
  off: EventEmitter<T>['off']
}

export type State<T> = T & StateSubscription<unknown>

function fastParse(val?: string): any {
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

function fastStringify(val: any): string {
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

function shouldBeStringified(val: any): boolean {
  const type = typeof val;
  return (type === 'string' || (type === 'object' && val !== null));
}

function makeGlobalName(name: string): string {
  return `OverwolfGlobalState/${name}`;
}

function hydratePersistentState<T extends MapByString>
(prefix: string, initialState: T): T {
  const
    state = Utils.objectCopy<T>(initialState),
    prefixLength = prefix.length;

  for (const key in localStorage) {
    if (key.length > prefixLength && key.startsWith(prefix)) {
      const
        stringified: string = localStorage[key],
        stateKey = key.substr(prefixLength),
        value = fastParse(localStorage[key]);

      if (shouldBeStringified(value)) {
        (state as MapByString)[stateKey] = stringified;
      } else {
        (state as MapByString)[stateKey] = value;
      }
    }
  }

  return state;
}

export function makeState<T extends MapByString>
(name: string, initialState: T, persistent = false): State<T> {
  const
    lsPrefix = `${name}/`,
    bus = new EventEmitter(),
    busOn = bus.on.bind(bus),
    busOff = bus.off.bind(bus);

  const state = persistent
    ? hydratePersistentState<T>(lsPrefix, initialState)
    : Utils.objectCopy<T>(initialState);

  const store = new Proxy<T>(state, {
    has(target, prop: string) {
      return target.hasOwnProperty(prop);
    },
    get(target, prop: string) {
      switch (prop) {
        case 'on':
          return busOn;
        case 'off':
          return busOff;
      }

      const value = target[prop];

      if (typeof value === 'string' && value !== undefined) {
        return fastParse(value);
      }

      return value;
    },
    set(target, prop: string, value: any) {
      const currentState = (target as MapByString);

      if (!target.hasOwnProperty(prop)) {
        throw new Error(`Property ${prop} does not exist in state`);
      }

      const shallBeStringified = shouldBeStringified(value);

      const stringified = (shallBeStringified || persistent)
        ? fastStringify(value)
        : undefined;

      currentState[prop] = shallBeStringified ? stringified : value;

      if (persistent) {
        localStorage[lsPrefix + prop] = stringified;
      }

      bus.emit(prop);

      return true;
    },
    deleteProperty() {
      return false;
    },
    ownKeys() {
      return [];
    }
  }) as State<T>;

  (window as MapByString)[makeGlobalName(name)] = store;

  return store;
}

export function makeStateClient<T>(name: string): State<T> {
  const win = overwolf.windows.getMainWindow() as MapByString;

  return win[makeGlobalName(name)] as State<T>;
}
