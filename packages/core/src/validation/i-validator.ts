import { IFormControl } from '../form';
import { ValidationError } from './validation-error';

export type ValidatorFn<T> = (value: T) => ValidationError | undefined;

export interface IValidator<T> {
  validate: ValidatorFn<T>;
}

export type ValidatorFnConfigurationOptions<TFormData> = {
  controlOf: (
    path: keyof TFormData
  ) => IFormControl<TFormData[keyof TFormData]> | undefined;
};

export type ValidatorFnConfiguration<TFormData, TValue> = (
  options: ValidatorFnConfigurationOptions<TFormData>
) => ValidatorFn<TValue>;

export type ValidatorFnFactory<T> = () => ValidatorFn<T>;
