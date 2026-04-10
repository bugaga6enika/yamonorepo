import { DomainEvent } from './domain-event';
import { EventListener } from './event-listener';

export interface IEventSource<T extends DomainEvent> {
  addEventsListener(eventListener: EventListener<T>): void;
  removeEventsListener(eventListener: EventListener<T>): void;
  addEventListener(event: T['type'], eventListener: EventListener<T>): void;
  removeEventListener(event: string, eventListener: EventListener<T>): void;
}
