import {
  ValidationError,
  ValidatorFn,
  ValidatorFnConfiguration,
} from '../../validation';
import { IFormManager } from './i-form-manager';
import { FormControlEvent, IFormControl } from '../form-control/i-form-control';
import { FormControl } from '../form-control';
import { entries } from '../../utils';
import { EventDispatcher, EventListener } from '../../event-source';
import { isBusyChangeEventFactory } from '../../busy';
import { FormManagerEvent } from './form-manager.events';

export type FormManagerFieldOption<TFormData> = {
  validators?: Array<
    ValidatorFnConfiguration<TFormData, TFormData[keyof TFormData]>
  >;
  disabled?: boolean;
};

export type FormManagerOptions<
  TFormData extends Record<keyof TFormData, TFormData[keyof TFormData]>
> = Partial<Record<keyof TFormData, FormManagerFieldOption<TFormData>>>;

export class FormManager<
  TFormData extends Record<keyof TFormData, TFormData[keyof TFormData]>,
  TResult
> implements IFormManager<TFormData, TResult>
{
  private _isBusy = false;
  private _isValid = true;
  private _isDisabled = false;
  private _errors: ValidationError | undefined = undefined;
  private readonly _eventDispatcher = new EventDispatcher<
    FormManagerEvent<TFormData[keyof TFormData]>
  >();

  protected readonly controlsMap = new Map<
    keyof TFormData,
    IFormControl<TFormData[keyof TFormData]>
  >();

  protected readonly _validatorsMap = new Map<
    keyof TFormData,
    ValidatorFn<unknown>
  >();

  get isValid(): boolean {
    return this._isValid;
  }

  get isDisabled(): boolean {
    return this._isDisabled;
  }

  get errors() {
    return this._errors;
  }

  get isBusy(): boolean {
    return this._isBusy;
  }

  get controls() {
    return this.controlsMap.entries();
  }

  constructor(
    form: TFormData,
    options?: FormManagerOptions<TFormData>,
    private readonly _action?: (
      abortSignal: AbortSignal,
      context: TFormData
    ) => Promise<TResult>
  ) {
    // Initialize controls for each field in the form
    for (const [key, value] of entries(form)) {
      const fieldOptions = options?.[key];
      const control = new FormControl(value, {
        disabled: fieldOptions?.disabled,
        validatorFactories: fieldOptions?.validators
          ?.map((validator) => {
            if (typeof validator === 'function') {
              return validator.bind(this, {
                controlOf: this.getControl.bind(this),
              });
            }

            return undefined;
          })
          .filter((x) => !!x),
      });

      control.addEventsListener((event) => this.onEvent(key, event));

      this.controlsMap.set(
        key,
        control as IFormControl<TFormData[keyof TFormData]>
      );
    }
  }

  addEventsListener(
    eventListener: EventListener<FormManagerEvent<TFormData[keyof TFormData]>>
  ): void {
    this._eventDispatcher.addEventsListener(eventListener);
  }

  removeEventsListener(
    eventListener: EventListener<FormManagerEvent<TFormData[keyof TFormData]>>
  ): void {
    this._eventDispatcher.removeEventsListener(eventListener);
  }

  addEventListener(
    event: string,
    eventListener: EventListener<FormManagerEvent<TFormData[keyof TFormData]>>
  ): void {
    this._eventDispatcher.addEventListener(event, eventListener);
  }

  removeEventListener(
    event: string,
    eventListener: EventListener<FormManagerEvent<TFormData[keyof TFormData]>>
  ): void {
    this._eventDispatcher.removeEventListener(event, eventListener);
  }

  validate(): ValidationError | undefined {
    let result: ValidationError | undefined = undefined;
    for (const control of this.controlsMap.values()) {
      const validationResult = control.validate();
      if (validationResult) {
        result = result
          ? { ...(result as object), ...validationResult }
          : validationResult;
      }
    }

    this._errors = result;
    this._isValid = !result;

    return result;
  }

  disable(): void {
    this._isDisabled = true;
  }

  enable(): void {
    this._isDisabled = false;
  }

  async submit(abortSignal: AbortSignal): Promise<TResult> {
    if (!this._action) {
      throw new ReferenceError('Action is not defined');
    }

    const isValid = this.validate() === undefined;

    if (!isValid) {
      throw new Error('Form is invalid');
    }

    this._isBusy = true;
    this._eventDispatcher.dispatch(isBusyChangeEventFactory(false, true));

    const formData: TFormData = {} as TFormData;

    for (const [key, entry] of this.controlsMap.entries()) {
      if (!entry.isDisabled && entry.isValid) {
        formData[key] = entry.value;
      }
    }
    try {
      return await this._action(abortSignal, formData);
    } catch (error) {
      throw error instanceof Error ? error : new Error(error as string);
    } finally {
      this._isBusy = false;
      this._eventDispatcher.dispatch(isBusyChangeEventFactory(true, false));
    }
  }

  getControl(
    fieldKey: keyof TFormData
  ): IFormControl<TFormData[keyof TFormData]> | undefined {
    return this.controlsMap.get(fieldKey);
  }

  clear(): void {
    for (const control of this.controlsMap.values()) {
      control.clear();
    }

    this._eventDispatcher.clear();
  }

  private onEvent(
    controlKey: keyof TFormData,
    event: FormControlEvent<TFormData[keyof TFormData]>
  ) {
    this._eventDispatcher.dispatch({
      ...event,
      control: controlKey as string,
    });
  }
}
