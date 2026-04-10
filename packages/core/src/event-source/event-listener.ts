import { DomainEvent } from './domain-event';

export type EventListener<T extends DomainEvent> = (event: T) => void;
