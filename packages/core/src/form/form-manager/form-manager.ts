import {
  ValidationError,
  ValidatorFn,
  ValidatorFnConfiguration,
  ValidatorFnConfigurationOptions,
} from '../../validation';
import { IFormManager } from './i-form-manager';
import { FormControlEvent, IFormControl } from '../form-control/i-form-control';
import { FormControl } from '../form-control';
import { entries } from '../../utils';
import { EventDispatcher, EventListener } from '../../event-source';
import { isBusyChangeEventFactory } from '../../busy';
import { FormManagerEvent } from './form-manager.events';
import { createFormProxy } from '../form-proxy';
import { AnyFormNode, FormNodeAtPath, FormPath, IFormNode } from '../i-form';

export type FormManagerFieldOption<TFormData, TValue> = {
  validators?: Array<ValidatorFnConfiguration<TFormData, TValue>>;
  disabled?: boolean;
};

export type FormManagerOptions<TFormData extends Record<string, unknown>> = {
  [TKey in keyof TFormData]?: TFormData[TKey] extends Record<string, unknown>
    ? FormManagerOptions<TFormData[TKey]>
    : FormManagerFieldOption<TFormData, TFormData[TKey]>;
};

type FormManagerControl<TValue, TResult> =
  | IFormControl<TValue>
  | FormManager<Extract<TValue, Record<string, unknown>>, TResult>;

export class FormManager<TFormData extends Record<string, unknown>, TResult>
  implements IFormManager<TFormData, TResult>
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
    FormManagerControl<TFormData[keyof TFormData], TResult>
  >();

  protected readonly _validatorsMap = new Map<
    keyof TFormData,
    ValidatorFn<unknown>
  >();

  private readonly proxiedControlsMap = new Map<
    keyof TFormData,
    IFormNode<TFormData[keyof TFormData], TResult>
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
    return this.getControls();
  }

  constructor(
    form: TFormData,
    options?: FormManagerOptions<TFormData>,
    private readonly _action?: (
      abortSignal: AbortSignal,
      context: TFormData
    ) => Promise<TResult>,
    private readonly controlResolver?: (
      path: string
    ) => AnyFormNode<TResult> | undefined
  ) {
    // Initialize controls for each field in the form
    for (const [key, value] of entries(form)) {
      const fieldOptions = options?.[key];

      if (isFormGroupValue(value)) {
        const nestedManager = new FormManager(
          value,
          fieldOptions as FormManagerOptions<typeof value>,
          undefined,
          this.resolveControlPath.bind(this)
        );

        nestedManager.addEventsListener((event) =>
          this.onNestedEvent(key, event as FormManagerEvent<TFormData[keyof TFormData]>)
        );
        this.controlsMap.set(
          key,
          nestedManager as FormManagerControl<TFormData[keyof TFormData], TResult>
        );
        continue;
      }

      const control = new FormControl(value, {
        disabled: (fieldOptions as FormManagerFieldOption<
          TFormData,
          typeof value
        > | undefined)?.disabled,
        validatorFactories: (
          fieldOptions as FormManagerFieldOption<TFormData, typeof value> | undefined
        )?.validators
          ?.map((validator) => {
            if (typeof validator === 'function') {
              return validator.bind(this, {
                controlOf: ((path: string) =>
                  this.controlResolver?.(String(path)) ??
                  this.getControl(String(path))) as ValidatorFnConfigurationOptions<TFormData>['controlOf'],
              });
            }

            return undefined;
          })
          .filter((x) => !!x),
      });

      control.addEventsListener((event) => this.onEvent(key, event));

      this.controlsMap.set(key, control);
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

    const formData = this.getData();
    try {
      return await this._action(abortSignal, formData);
    } catch (error) {
      throw error instanceof Error ? error : new Error(error as string);
    } finally {
      this._isBusy = false;
      this._eventDispatcher.dispatch(isBusyChangeEventFactory(true, false));
    }
  }

  getControl<TPath extends FormPath<TFormData>>(
    path: TPath
  ): FormNodeAtPath<TFormData, TPath, TResult> | undefined;
  getControl(path: string): AnyFormNode<TResult> | undefined;
  getControl(path: string): AnyFormNode<TResult> | undefined {
    return this.resolveControlPath(String(path));
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

  private *getControls(): IterableIterator<
    [keyof TFormData, IFormNode<TFormData[keyof TFormData], TResult>]
  > {
    for (const [key] of this.controlsMap.entries()) {
      const control = this.getDirectControl(key);
      if (control) {
        yield [key, control];
      }
    }
  }

  private getData(): TFormData {
    const formData = {} as TFormData;

    for (const [key, entry] of this.controlsMap.entries()) {
      if (entry.isDisabled || !entry.isValid) {
        continue;
      }

      if (entry instanceof FormManager) {
        formData[key] = entry.getData() as TFormData[keyof TFormData];
        continue;
      }

      formData[key] = entry.value;
    }

    return formData;
  }

  private onNestedEvent(
    controlKey: keyof TFormData,
    event: FormManagerEvent<TFormData[keyof TFormData]>
  ) {
    if ('control' in event) {
      this._eventDispatcher.dispatch({
        ...event,
        control: `${String(controlKey)}.${event.control}`,
      });
      return;
    }

    this._eventDispatcher.dispatch(event);
  }

  private resolveControlPath(path: string): AnyFormNode<TResult> | undefined {
    const normalizedPath = path.trim();
    if (!normalizedPath) {
      return undefined;
    }

    if (this.controlResolver && normalizedPath.includes('.')) {
      return this.controlResolver(normalizedPath);
    }

    const [currentKey, ...rest] = normalizedPath.split('.');
    const control = this.getDirectControl(currentKey as keyof TFormData);

    if (!control) {
      return undefined;
    }

    if (rest.length === 0) {
      return control;
    }

    if (!(control instanceof FormManager)) {
      return undefined;
    }

    return control.resolveControlPath(rest.join('.'));
  }

  private getDirectControl(
    fieldKey: keyof TFormData
  ): IFormNode<TFormData[keyof TFormData], TResult> | undefined {
    const existingProxy = this.proxiedControlsMap.get(fieldKey);
    if (existingProxy) {
      return existingProxy;
    }

    const control = this.controlsMap.get(fieldKey);
    if (!control) {
      return undefined;
    }

    if (control instanceof FormManager) {
      const proxy = createFormProxy(control);
      this.proxiedControlsMap.set(
        fieldKey,
        proxy as IFormNode<TFormData[keyof TFormData], TResult>
      );
      return proxy as IFormNode<TFormData[keyof TFormData], TResult>;
    }

    return control as IFormNode<TFormData[keyof TFormData], TResult>;
  }
}

const isFormGroupValue = (
  value: unknown
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
