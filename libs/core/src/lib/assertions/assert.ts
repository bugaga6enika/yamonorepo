import { NullReferenceError } from '../errors';

export class Assert {
  private static parseRecord<T>(instanceRecord: Record<string, T>) {
    if (!instanceRecord) {
      throw new NullReferenceError('instanceRecord');
    }

    const valueArr = Object.entries(instanceRecord);

    if (valueArr.length !== 1) {
      throw new RangeError('Cannot assert argument');
    }

    return valueArr[0];
  }

  static nullReference(instanceRecord: Record<string, unknown>) {
    const [key, value] = Assert.parseRecord(instanceRecord);

    if (!value) {
      throw new NullReferenceError(key);
    }
  }

  static nullOrEmpty(instanceRecord: Record<string, string>) {
    Assert.nullReference(instanceRecord);
    const [key, value] = Assert.parseRecord(instanceRecord);

    if (value.length === 0) {
      throw new RangeError(`String ${key} cannot be empty`);
    }
  }
}
