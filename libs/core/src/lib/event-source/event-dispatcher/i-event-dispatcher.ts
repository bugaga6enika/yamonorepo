import { DomainEvent } from '../domain-event';
import { IEventSource } from '../i-event-source';

export interface IEventDispatcher<T extends DomainEvent>
  extends IEventSource<T> {
  dispatch(event: T): void;
}
