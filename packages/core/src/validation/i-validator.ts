import { AnyFormNode, FormNodeAtPath, FormPath } from '../form';
import { ValidationError } from './validation-error';

export type ValidatorFn<T> = (value: T) => ValidationError | undefined;

export interface IValidator<T> {
  validate: ValidatorFn<T>;
}

export type ValidatorFnConfigurationOptions<TFormData> = {
  controlOf<TPath extends FormPath<TFormData>>(
    path: TPath
  ): FormNodeAtPath<TFormData, TPath> | undefined;
  controlOf(path: string): AnyFormNode | undefined;
};

export type ValidatorFnConfiguration<TFormData, TValue> = (
  options: ValidatorFnConfigurationOptions<TFormData>
) => ValidatorFn<TValue>;

export type ValidatorFnFactory<T> = () => ValidatorFn<T>;
