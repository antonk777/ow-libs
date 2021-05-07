export function binder(target) {
    const methods = {};
    return new Proxy(target, {
        has(_targ, prop) {
            return methods.hasOwnProperty(prop);
        },
        get(targ, prop) {
            if (methods[prop] === undefined &&
                targ.hasOwnProperty(prop)) {
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
        deleteProperty(_targ, prop) {
            delete methods[prop];
            return true;
        },
        ownKeys() {
            return [];
        }
    });
}
//# sourceMappingURL=binder.js.map