type MethodsRecord = {
  [key: string]: () => any
}

export function binder<T extends Record<string, any>>(target: T): T {
  const methods: MethodsRecord = {};

  return new Proxy<T>(target, {
    has(_target, prop: string) {
      return methods.hasOwnProperty(prop);
    },
    get(targ, prop: string) {
      if (methods[prop] === undefined && targ[prop]) {
        const method = targ[prop];

        if (typeof method === 'function') {
          methods[prop] = method.bind(targ);
        }
      }

      return methods[prop];
    },
    set() {
      return true;
    },
    deleteProperty(_target, prop: string) {
      delete methods[prop];
      return true;
    },
    ownKeys() {
      return [];
    }
  });
}
