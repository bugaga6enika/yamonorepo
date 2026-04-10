import { describe, expect, test } from "vitest";
import { Operation } from "./operation";

describe("Operation", () => {
  class TestOperation extends Operation<string> {}

  test("should throw if name is not presented", () => {
    const factory = () =>
      new TestOperation(
        undefined as unknown as string,
        undefined as unknown as (abortSignal: AbortSignal) => Promise<string>,
      );
    expect(factory).toThrow(
      "A null reference recieved for the expected instance of -- name --",
    );
  });
});
