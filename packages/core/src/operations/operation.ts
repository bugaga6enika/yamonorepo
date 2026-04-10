import { Assert } from '../assertions/assert';
import { IOperation, OperationError, OperationResult } from './i-operation';
import { OperationState } from './operation.state';

export abstract class Operation<TResult> implements IOperation<TResult, OperationState> {
  private readonly _abortController = new AbortController();
  private _state: OperationState = 'idle';
  readonly id: string = crypto.randomUUID();

  get state(): OperationState {
    return this._state;
  }
  readonly result: TResult | undefined;
  readonly error: Error | undefined;

  constructor(readonly name: string, private readonly action: (abortSignal: AbortSignal) => Promise<TResult>) {
    Assert.nullOrEmpty({ name });
    Assert.nullReference({ action });
  }

  async run(): Promise<TResult> {
    if (this.state !== 'idle') {
      throw new Error(`Cannot start ${this.state} operation.`);
    }
    this.setState('running');

    try {
      const result = await this.action(this._abortController.signal);
      this.setState('finished', { result });

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.setState('failed', { error });
      }
    }
    return Promise.reject(undefined);
  }

  cancel(): void {
    this._abortController.abort();
    this.setState('canceled');
  }

  // @ts-expect-error Delegate
  stateChange: (state: OperationState, details: OperationError | OperationResult<TResult> | undefined) => void;

  protected setState(state: OperationState, details: OperationError | OperationResult<TResult> | undefined = undefined) {
    this._state = state;
    this.stateChange?.(state, details);
  }
}
