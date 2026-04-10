import { describe, expect, test, vi } from 'vitest';
import { FormControl } from './form-control';
import { minLength, required } from '../../validation';
import { FormControlEvent } from './i-form-control';

describe('FormControl', () => {
  test('should be defined with value', () => {
    const control = new FormControl<string>('test');
    expect(control).toBeDefined();
    expect(control.value).toBe('test');
  });

  test('should be defined disabled', () => {
    const control = new FormControl<string>('test', {
      disabled: true,
    });
    expect(control).toBeDefined();
    expect(control.isDisabled).toBe(true);
  });

  test('should be defined with no validators', () => {
    const control = new FormControl<string>('');
    control.validate();
    expect(control.isValid).toBe(true);
    control.setValue('bzaaaaaaaaaaaaaaa');
    control.validate();
    expect(control.isValid).toBe(true);
    expect(control['_validatorFactories'].length).toBe(0);
  });

  test('should execute validate function on setValue call', () => {
    const control = new FormControl<string>('');
    const spy = vi
      .spyOn(control, 'validate')
      .mockImplementation(() => undefined);
    control.setValue('new value');
    expect(spy).toBeCalled();
  });

  test('should validate value with given validators', () => {
    const control = new FormControl<string>('', {
      validatorFactories: [
        () => (value) => required(value),
        () => (value) => minLength(value, 5),
      ],
    });

    const requiredError = control.validate();

    expect(control.isValid).toBe(false);
    expect(control.errors).toHaveProperty('required');
    expect(requiredError).toHaveProperty('required');

    const minLengthError = control.setValue('test');

    expect(control.isValid).toBe(false);
    expect(control.errors).toHaveProperty('minLength');
    expect(control.errors).toHaveProperty('minLength.requiredLength', 5);
    expect(control.errors).toHaveProperty('minLength.actualLength', 4);

    expect(minLengthError).toHaveProperty('minLength');
    expect(minLengthError).toHaveProperty('minLength.requiredLength', 5);
    expect(minLengthError).toHaveProperty('minLength.actualLength', 4);

    const noError = control.setValue('valid value');

    expect(control.isValid).toBe(true);
    expect(noError).toBe(undefined);
    expect(control.errors).toBe(undefined);
  });

  test('should be disabled on demand', () => {
    const control = new FormControl<number>(4);
    expect(control.isDisabled).toBe(false);
    control.disable();
    expect(control.isDisabled).toBe(true);
  });

  test('should be enabled on demand', () => {
    const control = new FormControl<number>(4, { disabled: true });
    expect(control.isDisabled).toBe(true);
    control.enable();
    expect(control.isDisabled).toBe(false);
  });

  test('should emit value change event on value change', () => {
    const control = new FormControl<boolean>(false);
    const eventsListener = (event: FormControlEvent<boolean>) => {
      expect(event.type).toBe('value');
      expect(event.previous).toBe(false);
      expect(event.current).toBe(true);

      control.removeEventsListener(eventsListener);
    };

    const valueChangeEventListener = (event: FormControlEvent<boolean>) => {
      expect(event.type).toBe('value');
      expect(event.previous).toBe(false);
      expect(event.current).toBe(true);

      control.removeEventListener('value', valueChangeEventListener);
    };

    control.addEventsListener(eventsListener);
    control.addEventListener('value', valueChangeEventListener);

    control.setValue(true);
  });

  test('should emit validity change event on value change', () => {
    const control = new FormControl<string>('test', {
      validatorFactories: [() => (value) => required(value)],
    });
    const validityEventListener = (event: FormControlEvent<string>) => {
      expect(event.type).toBe('validity');
      expect(event.previous).toBe(true);
      expect(event.current).toBe(false);

      control.removeEventListener('validity', validityEventListener);
    };

    const errorChangeEventListener = (event: FormControlEvent<string>) => {
      expect(event.type).toBe('error');
      expect(event.previous).toBe(undefined);
      expect(event.current).toHaveProperty('required', true);

      control.removeEventListener('error', errorChangeEventListener);
    };

    control.addEventListener('validity', validityEventListener);
    control.addEventListener('error', errorChangeEventListener);

    control.setValue('');
  });

  test('should emit availability change event on disable', () => {
    const control = new FormControl<string>('test');
    const availabilityEventListener = (event: FormControlEvent<string>) => {
      expect(event.type).toBe('availability');
      expect(event.previous).toBe(true);
      expect(event.current).toBe(false);

      control.removeEventListener('availability', availabilityEventListener);
    };

    control.addEventListener('availability', availabilityEventListener);

    control.disable();
  });

  test('should call eventDispatcher clear method on clear', () => {
    const control = new FormControl<string>('');
    const spy = vi
      .spyOn(control['_eventDispatcher'], 'clear')
      .mockImplementation(() => undefined);
    control.clear();
    expect(spy).toBeCalledTimes(1);
  });
});
