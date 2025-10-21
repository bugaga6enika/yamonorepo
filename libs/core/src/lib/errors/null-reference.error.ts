export class NullReferenceError extends ReferenceError {
  constructor(expectedReferenceName: string, options?: ErrorOptions) {
    super(`A null reference recieved to the expected instance of ${expectedReferenceName}`, options);
  }
}
