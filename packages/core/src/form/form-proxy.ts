import { NullReferenceError } from '../errors';
import { IForm } from './i-form';
import { IFormManager } from './form-manager/i-form-manager';

export const createFormProxy = <
  TSchema extends Record<string, unknown>,
  TResult,
>(
  manager: IFormManager<TSchema, TResult>
): IForm<TSchema, TResult> =>
  new Proxy(manager, {
    get(target, prop) {
      if (typeof prop !== 'string') {
        return Reflect.get(
          target as object,
          prop
        );
      }

      if (Reflect.has(target, prop)) {
        return target[prop as keyof IFormManager<TSchema, TResult>];
      }

      const control = target.getControl(prop);

      if (!control) {
        throw new NullReferenceError(`${String(prop)}.`);
      }

      return control;
    },
  }) as unknown as IForm<TSchema, TResult>;
