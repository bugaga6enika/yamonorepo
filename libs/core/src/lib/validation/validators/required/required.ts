import { ValidationError } from '../../validation-error';

export const required = (value: string): ValidationError | undefined => {
  if (value === null || value === undefined || value === '') {
    return { required: true };
  }
  return undefined;
};

// export class Required<T> implements IValidator<T> {
//   validate = required;
// }
