import { DomainEventGeneric } from '../event-source';

export interface IToggleable {
  isDisabled: boolean;
  disable(): void;
  enable(): void;
}

export type AvailabilityChangeEvent = DomainEventGeneric<
  'availability',
  boolean
>;
