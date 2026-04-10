import { IBusy } from '../../busy';
import { IClearable } from '../../clearable';
import { IEventSource } from '../../event-source';
import { IToggleable } from '../../toggle';
import { IValidatable } from '../../validation';
import { IFormControl } from '../form-control';
import { FormManagerEvent } from './form-manager.events';

export interface IFormManager<TForm, TResult>
  extends IBusy,
    IValidatable,
    IToggleable,
    IEventSource<FormManagerEvent<TForm[keyof TForm]>>,
    IClearable {
  controls: IterableIterator<[keyof TForm, IFormControl<TForm[keyof TForm]>]>;
  getControl(
    fieldKey: keyof TForm
  ): IFormControl<TForm[keyof TForm]> | undefined;
  submit(abortSignal: AbortSignal): Promise<TResult>;
}
