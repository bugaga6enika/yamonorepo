import { EventDispatcher, EventListener } from '../../event-source';
import { areEquals } from '../../utils';
import { ValidationError, ValidatorFnFactory } from '../../validation';
import { FormControlOption } from './form-control-option';
import { FormControlEvent, IFormControl } from './i-form-control';

export class FormControl<T> implements IFormControl<T> {
  private _value!: T;
  private _isValid = true;
  private _disabled = false;
  private _errors: ValidationError | undefined = undefined;

  private readonly _validatorFactories: Array<ValidatorFnFactory<T>> = [];
  private readonly _eventDispatcher = new EventDispatcher<
    FormControlEvent<T>
  >();

  constructor(value: T, options?: FormControlOption<T>) {
    this._value = value;
    this._disabled = options?.disabled || false;
    this._validatorFactories = options?.validatorFactories || [];
  }

  get value() {
    return this._value;
  }

  get isValid() {
    return this._isValid;
  }

  get isDisabled() {
    return this._disabled;
  }

  get errors() {
    return this._errors;
  }

  setValue(value: T): ValidationError | undefined {
    const old = this._value;
    this._value = value;
    if (!areEquals(old, value)) {
      this._eventDispatcher.dispatch({
        type: 'value',
        previous: old,
        current: value,
      });
    }

    return this.validate();
  }

  reset(): void {
    throw new Error('Method not implemented.');
  }

  validate(): ValidationError | undefined {
    if (this._disabled) {
      return undefined;
    }

    const oldValidity = this._isValid;
    const oldErrors = this._errors;

    let validationResult: ValidationError | undefined = undefined;
    for (const validator of this._validatorFactories) {
      validationResult = validator()(this._value);

      if (validationResult) {
        break;
      }
    }

    this._isValid = validationResult === undefined;
    this._errors = validationResult;

    if (!areEquals(oldValidity, this._isValid)) {
      this._eventDispatcher.dispatch({
        type: 'validity',
        previous: oldValidity,
        current: this._isValid,
      });
    }

    if (!areEquals(oldErrors, this._errors)) {
      this._eventDispatcher.dispatch({
        type: 'error',
        previous: oldErrors,
        current: this._errors,
      });
    }

    return validationResult;
  }

  disable(): void {
    const old = this._disabled;
    this._disabled = true;
    if (!areEquals(old, true)) {
      this._eventDispatcher.dispatch({
        type: 'availability',
        previous: old,
        current: false,
      });
    }
  }

  enable(): void {
    const old = this._disabled;
    this._disabled = false;
    if (!areEquals(old, false)) {
      this._eventDispatcher.dispatch({
        type: 'availability',
        previous: old,
        current: true,
      });
    }
  }

  addEventsListener(eventListener: EventListener<FormControlEvent<T>>) {
    this._eventDispatcher.addEventsListener(eventListener);
  }

  removeEventsListener(eventListener: EventListener<FormControlEvent<T>>) {
    this._eventDispatcher.removeEventsListener(eventListener);
  }

  addEventListener(
    event: string,
    eventListener: EventListener<FormControlEvent<T>>
  ): void {
    this._eventDispatcher.addEventListener(event, eventListener);
  }

  removeEventListener(
    event: string,
    eventListener: EventListener<FormControlEvent<T>>
  ): void {
    this._eventDispatcher.removeEventListener(event, eventListener);
  }

  clear(): void {
    this._eventDispatcher.clear();
  }
}
