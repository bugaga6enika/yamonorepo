import { Operation } from './operation';

describe('Operation', () => {
  class TestOperation extends Operation<string> {}

  it('should throw if name is not presented', () => {
    const factory = () =>
      new TestOperation(undefined as unknown as string, undefined as unknown as (abortSignal: AbortSignal) => Promise<string>);
    expect(factory).toThrowError('Name is not presented');
  });
});
