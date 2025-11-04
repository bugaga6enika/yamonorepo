import { IValidator, ValidationError } from '../..';
import { Assert } from '../../../assertions/assert';

export const minLength = (
  value: string,
  minLength: number
): ValidationError | undefined => {
  Assert.nullReference({ value });

  if (value.length < minLength) {
    return {
      minLength: {
        requiredLength: minLength,
        actualLength: value.length,
      },
    };
  }

  return undefined;
};

export class MinLength implements IValidator<string> {
  constructor(private readonly minLength: number) {}

  validate(value: string): ValidationError | undefined {
    Assert.nullReference({ value });

    if (value.length < this.minLength) {
      return {
        minLength: {
          requiredLength: this.minLength,
          actualLength: value.length,
        },
      };
    }

    return undefined;
  }
}
