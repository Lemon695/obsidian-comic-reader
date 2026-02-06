/**
 * 核心模块统一导出
 */

export { EventBus, getEventBus, resetEventBus } from './event-bus';
export type { EventMap } from './event-bus';

export { StateManager, getStateManager, resetStateManager } from './state-manager';
export type { AppState } from './state-manager';
