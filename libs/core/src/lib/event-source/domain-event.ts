export type DomainEvent = {
  type: string;
  previous: unknown;
  current: unknown;
};

export type DomainEventGeneric<TType extends string, TValue> = {
  type: TType;
  previous: TValue;
  current: TValue;
} & DomainEvent;
