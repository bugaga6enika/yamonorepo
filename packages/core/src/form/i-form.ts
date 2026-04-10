import { IFormControl } from './form-control';
import { IFormManager } from './form-manager/i-form-manager';

type FormObject = Record<string, unknown>;
type StringKeyOf<T> = Extract<keyof T, string>;

export type FormPath<TForm> = {
  [TKey in StringKeyOf<TForm>]: TForm[TKey] extends FormObject
    ? `${TKey}` | `${TKey}.${FormPath<TForm[TKey]>}`
    : `${TKey}`;
}[StringKeyOf<TForm>];

export type FormValueAtPath<TForm, TPath extends string> =
  TPath extends `${infer TKey}.${infer TRest}`
    ? TKey extends keyof TForm
      ? TForm[TKey] extends FormObject
        ? FormValueAtPath<TForm[TKey], TRest>
        : never
      : never
    : TPath extends keyof TForm
      ? TForm[TPath]
      : never;

export type AnyFormNode<TResult = unknown> =
  | IFormControl<unknown>
  | IForm<FormObject, TResult>;

export type IFormNode<TValue, TResult = unknown> =
  TValue extends FormObject
    ? IForm<TValue, TResult>
    : IFormControl<TValue>;

export type FormNodeAtPath<
  TForm,
  TPath extends FormPath<TForm>,
  TResult = unknown,
> = IFormNode<FormValueAtPath<TForm, TPath>, TResult>;

export type IForm<TForm, TResult> = {
  [TKey in keyof TForm]: IFormNode<TForm[TKey], TResult>;
} & IFormManager<TForm, TResult>;
