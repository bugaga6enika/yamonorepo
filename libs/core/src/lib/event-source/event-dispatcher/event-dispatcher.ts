import { IClearable } from '../../clearable';
import { DomainEvent } from '../domain-event';
import { EventListener } from '../event-listener';
import { IEventDispatcher } from './i-event-dispatcher';

export class EventDispatcher<T extends DomainEvent>
  implements IEventDispatcher<T>, IClearable
{
  private readonly _eventListenersSet = new Set<EventListener<T>>();
  private readonly _eventListenersMap = new Map<
    string,
    Set<EventListener<T>>
  >();

  dispatch(event: T): void {
    for (const eventListener of this._eventListenersSet.values()) {
      eventListener?.(event);
    }

    for (const eventListener of this._eventListenersMap
      .get(event.type)
      ?.values() ?? []) {
      eventListener?.(event);
    }
  }

  addEventsListener(eventListener: EventListener<T>): void {
    this._eventListenersSet.add(eventListener);
  }

  removeEventsListener(eventListener: EventListener<T>): void {
    this._eventListenersSet.delete(eventListener);
  }

  addEventListener(event: string, eventListener: EventListener<T>): void {
    const eventListeners =
      this._eventListenersMap.get(event) ?? new Set<EventListener<T>>();
    eventListeners.add(eventListener);
    this._eventListenersMap.set(event, eventListeners);
  }

  removeEventListener(event: string, eventListener: EventListener<T>): void {
    const eventListeners =
      this._eventListenersMap.get(event) ?? new Set<EventListener<T>>();
    eventListeners.delete(eventListener);
    this._eventListenersMap.set(event, eventListeners);
  }

  clear(): void {
    this._eventListenersSet.clear();
    this._eventListenersMap.clear();
  }
}
