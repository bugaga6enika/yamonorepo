import { NullReferenceError } from '../errors';
import { FormManagerFieldOption, FormManager } from './form-manager';
import { IForm } from './i-form';

export const form = <
  TSchema extends Record<string, TSchema[keyof TSchema]>,
  TResult
>(
  schema: TSchema,
  options?: Partial<Record<keyof TSchema, FormManagerFieldOption<TSchema>>>,
  submit?: (abortSignal: AbortSignal, context: TSchema) => Promise<TResult>
): IForm<TSchema, TResult> => {
  const form = new FormManager<TSchema, TResult>(schema, options, submit);
  const proxy = new Proxy(form, {
    get(target, prop) {
      const formManagerProp =
        target[prop as keyof FormManager<TSchema, TResult>];

      if (formManagerProp) {
        return formManagerProp;
      }

      const control = target.getControl(prop as string);

      if (!control) {
        throw new NullReferenceError(`${String(prop)}.`);
      }

      return control;
    },
  });

  return proxy as unknown as IForm<TSchema, TResult>;
};
