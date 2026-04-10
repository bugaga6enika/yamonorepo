import { IsBusyChangeEvent } from '../../busy';
import { AvailabilityChangeEvent } from '../../toggle';
import { ValidityChangeEvent, ErrorChangeEvent } from '../../validation';
import { ValueChangeEvent } from '../../value-holder';

type FormManagerControlEventBase = { control: string };

export type FormManagerControlValueChangeEvent<T> = ValueChangeEvent<T> &
  FormManagerControlEventBase;

export type FormManagerControlValidityChangeEvent = ValidityChangeEvent &
  FormManagerControlEventBase;

export type FormManagerControlAvailabilityChangeEvent =
  AvailabilityChangeEvent & FormManagerControlEventBase;

export type FormManagerControlErrorChangeEvent = ErrorChangeEvent &
  FormManagerControlEventBase;

export type FormManagerBusyEvent = IsBusyChangeEvent;

export type FormManagerEvent<T> =
  | FormManagerControlValueChangeEvent<T>
  | FormManagerControlValidityChangeEvent
  | FormManagerControlAvailabilityChangeEvent
  | FormManagerControlErrorChangeEvent
  | FormManagerBusyEvent;
