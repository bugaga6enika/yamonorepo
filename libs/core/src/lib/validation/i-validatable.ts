import { DomainEventGeneric } from '../event-source';
import { ValidationError } from './validation-error';

export interface IValidatable {
  readonly isValid: boolean;
  readonly errors: ValidationError | undefined;
  validate(): ValidationError | undefined;
}

export type ValidityChangeEvent = DomainEventGeneric<'validity', boolean>;

export type ErrorChangeEvent = DomainEventGeneric<
  'error',
  ValidationError | undefined
>;
