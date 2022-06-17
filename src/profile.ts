import { EventEmitter } from './event-emitter';

type LauncherStatusEventTypes = {
  login: overwolf.profile.LoginStateChangedEvent,
  subscription: overwolf.profile.subscriptions.SubscriptionChangedEvent
}

export class Profile extends EventEmitter<LauncherStatusEventTypes> {
  #started: boolean

  #onLoginStateChangedBound
  #onSubscriptionChangedBound

  constructor() {
    super();

    this.#onLoginStateChangedBound = this.#onLoginStateChanged.bind(this);
    this.#onSubscriptionChangedBound = this.#onSubscriptionChanged.bind(this);

    this.#started = false;
  }

  start(): void {
    if (this.#started) {
      return;
    }

    overwolf.profile.onLoginStateChanged
      .addListener(this.#onLoginStateChangedBound);
    overwolf.profile.subscriptions.onSubscriptionChanged
      .addListener(this.#onSubscriptionChangedBound);

    this.#started = true;
  }

  /** Remove all listeners */
  destroy(): void {
    overwolf.profile.onLoginStateChanged
      .removeListener(this.#onLoginStateChangedBound);
    overwolf.profile.subscriptions.onSubscriptionChanged
      .removeListener(this.#onSubscriptionChangedBound);

    this.#started = false;
  }

  #onLoginStateChanged(e: overwolf.profile.LoginStateChangedEvent): void {
    this.emit('login', e);
  }

  #onSubscriptionChanged(
    e: overwolf.profile.subscriptions.SubscriptionChangedEvent
  ): void {
    this.emit('subscription', e);
  }

  getCurrentUser(): Promise<overwolf.profile.GetCurrentUserResult> {
    return new Promise(resolve => {
      overwolf.profile.getCurrentUser(resolve);
    });
  }

  getActivePlans(): Promise<
    overwolf.profile.subscriptions.GetActivePlansResult
    > {
    return new Promise(resolve => {
      overwolf.profile.subscriptions.getActivePlans(resolve);
    });
  }

  getDetailedActivePlans(): Promise<
    overwolf.profile.subscriptions.GetDetailedActivePlansResult
    > {
    return new Promise(resolve => {
      overwolf.profile.subscriptions.getDetailedActivePlans(resolve);
    });
  }

  showSubscriptionsInApp(
    planId: number,
    theme: overwolf.profile.subscriptions.inapp.Theme
  ): Promise<void> {
    return new Promise(resolve => {
      overwolf.profile.subscriptions.inapp.show(planId, theme, () => resolve());
    });
  }

  hideSubscriptionsInApp(): Promise<void> {
    return new Promise(resolve => {
      overwolf.profile.subscriptions.inapp.hide(() => resolve());
    });
  }
}
