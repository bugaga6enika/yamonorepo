import { FormManager, FormManagerOptions } from './form-manager';
import { IForm } from './i-form';
import { createFormProxy } from './form-proxy';

export const form = <TSchema extends Record<string, unknown>, TResult>(
  schema: TSchema,
  options?: FormManagerOptions<TSchema>,
  submit?: (abortSignal: AbortSignal, context: TSchema) => Promise<TResult>
): IForm<TSchema, TResult> => {
  const manager = new FormManager<TSchema, TResult>(schema, options, submit);
  return createFormProxy(manager);
};
