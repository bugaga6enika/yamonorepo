import { ValidatorFnFactory } from '../../validation';

export type FormControlOption<T> = {
  validatorFactories?: Array<ValidatorFnFactory<T>>;
  disabled?: boolean;
};
