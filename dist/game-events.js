/* global overwolf*/
import { binder } from './binder';
import { EventEmitter, Utils } from './';
export class GameEvents extends EventEmitter {
    constructor(features) {
        super();
        this.features = features;
        // this.featuresSet = null;
        this.state = {};
        this.retries = 60;
        this.bound = binder(this);
        overwolf.games.events.onError.addListener(this.bound.onError);
    }
    destroy() {
        this.removeListeners();
        overwolf.games.events.onError.removeListener(this.bound.onError);
    }
    async start(gameStatus) {
        this.stop();
        const result = await this.setRequiredFeatures(gameStatus);
        if (result) {
            overwolf.games.events.getInfo(this.bound.onGotInfo);
            this.setListeners();
        }
    }
    stop() {
        this.state = {};
        this.removeListeners();
    }
    removeListeners() {
        overwolf.games.events.onInfoUpdates2
            .removeListener(this.bound.onInfoUpdate);
        overwolf.games.events.onNewEvents.removeListener(this.bound.onNewEvent);
    }
    setListeners() {
        overwolf.games.events.onInfoUpdates2.addListener(this.bound.onInfoUpdate);
        overwolf.games.events.onNewEvents.addListener(this.bound.onNewEvent);
    }
    onError(err) {
        console.log('gameEvents: error:', err);
    }
    onGotInfo(data) {
        if (!data || !data.success || !data.res)
            return;
        const info = data.res;
        for (const category in info) {
            if (category === 'features')
                continue;
            for (const key in info[category]) {
                if (info[category].hasOwnProperty(key)) {
                    const path = `${category}.${key}`;
                    let val = info[category][key];
                    if (val !== undefined &&
                        (this.state[path] === undefined || this.state[path] !== val)) {
                        this.state[path] = val;
                        try {
                            val = JSON.parse(val);
                        }
                        catch (e) {
                            console.log('onGotInfo(): JSON parsing error:', e);
                        }
                        const e = { path, category, key, val };
                        this.emit('*', e);
                        this.emit(path, e);
                    }
                }
            }
        }
    }
    onInfoUpdate(data) {
        if (!data || !data.info)
            return;
        const info = data.info;
        for (const category in info) {
            if (info.hasOwnProperty(category)) {
                for (const key in info[category]) {
                    if (info[category].hasOwnProperty(key)) {
                        const path = `${category}.${key}`;
                        let val = info[category][key];
                        if (val !== undefined &&
                            (this.state[path] === undefined || this.state[path] !== val)) {
                            this.state[path] = val;
                            try {
                                val = JSON.parse(val);
                            }
                            catch (e) {
                                console.log('onInfoUpdate(): JSON parsing error:', e);
                            }
                            const e = { path, category, key, val };
                            this.emit('*', e);
                            this.emit(path, e);
                        }
                    }
                }
            }
        }
    }
    onNewEvent(data) {
        if (!data.events || !data.events.length)
            return;
        for (const event of data.events) {
            const category = 'events', key = event.name, path = `${category}.${key}`;
            let val = event.data;
            if (val !== undefined &&
                (this.state[path] === undefined || this.state[path] !== val)) {
                this.state[path] = val;
            }
            try {
                val = JSON.parse(val);
            }
            catch (e) {
                console.log('onNewEvent(): JSON parsing error:', e);
            }
            const e = { path, category, key, val };
            this.emit('*', e);
            this.emit(path, e);
        }
    }
    setRequiredFeaturesPromise() {
        return new Promise(resolve => {
            overwolf.games.events.setRequiredFeatures(this.features, resolve);
        });
    }
    async setRequiredFeatures(gameStatus) {
        let tries = 0, result = null;
        while (tries < this.retries && gameStatus.isRunning) {
            result = await this.setRequiredFeaturesPromise();
            if (result.success) {
                console.log(...Utils.L('setRequiredFeatures(): success:', result));
                // this.featuresSet = result.supportedFeatures || null;
                return !!(result.supportedFeatures && result.supportedFeatures.length);
            }
            await Utils.delay(2000);
            tries++;
        }
        // this.featuresSet = null;
        console.log(`setRequiredFeatures(): failure after ${tries + 1} tries:`, result);
        return false;
    }
}
//# sourceMappingURL=game-events.js.map