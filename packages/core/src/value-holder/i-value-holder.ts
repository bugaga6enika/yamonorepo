import { DomainEventGeneric } from '../event-source';
import { ValidationError } from '../validation';

export interface IValueHolder<T> {
  setValue(value: T): ValidationError | undefined;
  readonly value: T;
}

export type ValueChangeEvent<T> = DomainEventGeneric<'value', T>;
