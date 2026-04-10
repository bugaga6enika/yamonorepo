import { IClearable } from '../../clearable';
import { IEventSource } from '../../event-source';
import { AvailabilityChangeEvent, IToggleable } from '../../toggle';
import {
  ErrorChangeEvent,
  IValidatable,
  ValidityChangeEvent,
} from '../../validation';
import { IValueHolder, ValueChangeEvent } from '../../value-holder';

export type FormControlValueChangeEvent<T> = ValueChangeEvent<T>;

export type FormControlValidityChangeEvent = ValidityChangeEvent;

export type FormControlAvailabilityChangeEvent = AvailabilityChangeEvent;

export type FormControlErrorChangeEvent = ErrorChangeEvent;

export type FormControlEvent<T> =
  | FormControlValueChangeEvent<T>
  | FormControlValidityChangeEvent
  | FormControlAvailabilityChangeEvent
  | FormControlErrorChangeEvent;

export interface IFormControl<T>
  extends IValueHolder<T>,
    IValidatable,
    IToggleable,
    IEventSource<FormControlEvent<T>>,
    IClearable {
  reset(): void;
}
