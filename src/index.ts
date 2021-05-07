import { GameEvents, GameEvent } from './game-events';

export * from './event-emitter';
export * from './game-events';
export * from './game-status';
export * from './launcher-status';
export * from './overwolf-plugin';
export * from './overwolf-window';
export * as Utils from './utils';

const gameEvents = new GameEvents(['match_info']);

gameEvents.on('*', (e: GameEvent) => {
  console.log(e.path, e.category);
});
