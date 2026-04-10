import { IFormControl } from './form-control';
import { IFormManager } from './form-manager/i-form-manager';

export type IForm<TForm, TResult> = Record<
  keyof TForm,
  IFormControl<TForm[keyof TForm]>
> &
  IFormManager<TForm, TResult>;
