import { DomainEventGeneric } from '../event-source';

export interface IBusy {
  isBusy: boolean;
}

export type IsBusyChangeEvent = DomainEventGeneric<'busy', boolean>;

export function isBusyChangeEventFactory(
  previous: boolean,
  current: boolean
): IsBusyChangeEvent {
  return {
    type: 'busy',
    previous,
    current,
  };
}
