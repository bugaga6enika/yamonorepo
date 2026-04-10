import { IBusy } from '../../busy';
import { IClearable } from '../../clearable';
import { IEventSource } from '../../event-source';
import { IToggleable } from '../../toggle';
import { IValidatable } from '../../validation';
import { AnyFormNode, FormNodeAtPath, FormPath, IFormNode } from '../i-form';
import { FormManagerEvent } from './form-manager.events';

export interface IFormManager<TForm, TResult>
  extends IBusy,
    IValidatable,
    IToggleable,
    IEventSource<FormManagerEvent<TForm[keyof TForm]>>,
    IClearable {
  controls: IterableIterator<[keyof TForm, IFormNode<TForm[keyof TForm], TResult>]>;
  getControl<TPath extends FormPath<TForm>>(
    fieldKey: TPath
  ): FormNodeAtPath<TForm, TPath, TResult> | undefined;
  getControl(fieldKey: string): AnyFormNode<TResult> | undefined;
  submit(abortSignal: AbortSignal): Promise<TResult>;
}
