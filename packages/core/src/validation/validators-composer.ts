import { IValidator, ValidationError } from '.';

export class ValidatorsComposer<T> implements IValidator<T> {
  private validators: IValidator<T>[] = [];

  constructor(...validators: IValidator<T>[]) {
    this.validators = validators;
  }

  validate(value: T): ValidationError | undefined {
    for (const validator of this.validators) {
      const validationResult = validator.validate(value);
      if (validationResult) {
        return validationResult;
      }
    }

    return undefined;
  }

  add(validator: IValidator<T>): this {
    this.validators.push(validator);
    return this;
  }

  remove(validator: IValidator<T>): this {
    this.validators = this.validators.filter((v) => v !== validator);
    return this;
  }
}
