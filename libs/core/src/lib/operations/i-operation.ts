export type OperationResult<TResult> = { result: TResult };
export type OperationError = { error: Error };

export interface IOperation<TResult, TState> {
  readonly id: string;
  readonly name: string;
  readonly state: TState;
  readonly result: TResult | undefined;
  readonly error: Error | undefined;

  run(): Promise<TResult>;
  cancel(): void;

  stateChange: (state: TState, details: OperationResult<TResult> | OperationError | undefined) => void;
}
