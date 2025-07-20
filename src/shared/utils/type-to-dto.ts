/* eslint-disable @typescript-eslint/no-empty-function */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsDate,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

type MetaConfig = {
  description?: string;
  optional?: boolean;
  example?: any;
};

function isPrimitive(value: any): value is string | number | boolean | Date {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Date
  );
}

function hasMeta(value: any): value is { __meta__: MetaConfig } {
  return typeof value === 'object' && value !== null && '__meta__' in value;
}

function getConstructor(
  value: unknown,
):
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | DateConstructor
  | ObjectConstructor {
  if (typeof value === 'string') return String;
  if (typeof value === 'number') return Number;
  if (typeof value === 'boolean') return Boolean;
  if (value instanceof Date) return Date;
  return Object;
}

function getTypeValidator(
  type:
    | StringConstructor
    | NumberConstructor
    | BooleanConstructor
    | DateConstructor,
): PropertyDecorator {
  switch (type) {
    case String:
      return IsString();
    case Number:
      return IsNumber();
    case Boolean:
      return IsBoolean();
    case Date:
      return IsDate();
    default:
      return () => {};
  }
}

export function generateDtoClassFromType<T extends object>(
  example: T,
  className = 'AnonymousDto',
): new () => T {
  const DynamicDtoClass = class {
    constructor() {
      Object.assign(this, example);
    }
    // static cName = className;
  };

  for (const [key, rawValue] of Object.entries(example)) {
    const value = hasMeta(rawValue) ? { ...rawValue } : rawValue;
    const meta: MetaConfig | undefined = hasMeta(rawValue)
      ? rawValue.__meta__
      : undefined;

    const decorators: PropertyDecorator[] = [];

    const isOptional = meta?.optional ?? false;
    const description = meta?.description;

    let propertyType: any;

    if (Array.isArray(value)) {
      const firstItem = value[0];

      if (firstItem == null) {
        propertyType = Array;
        decorators.push(IsArray());
      } else if (isPrimitive(firstItem)) {
        const itemType = getConstructor(firstItem);
        propertyType = Array;
        decorators.push(IsArray());
        if (itemType !== Object) {
          decorators.push(
            getTypeValidator(
              itemType as
                | StringConstructor
                | NumberConstructor
                | BooleanConstructor
                | DateConstructor,
            ),
          );
        }
      } else {
        const NestedItemClass = generateDtoClassFromType(
          firstItem,
          `${className}_${key}_Item`,
        );
        propertyType = Array;
        decorators.push(
          IsArray(),
          ValidateNested({ each: true }),
          Type(() => NestedItemClass),
        );
      }
    } else if (isPrimitive(value)) {
      propertyType = getConstructor(value);
      decorators.push(getTypeValidator(propertyType));
    } else {
      const NestedClass = generateDtoClassFromType(
        value,
        `${className}_${key}`,
      );
      propertyType = NestedClass;
      decorators.push(
        ValidateNested(),
        Type(() => NestedClass),
      );
    }

    if (isOptional) {
      decorators.push(IsOptional());
    }

    Object.defineProperty(DynamicDtoClass.prototype, key, {
      value: value,
      writable: true,
      enumerable: true,
      configurable: true,
    });

    Reflect.defineMetadata(
      'design:type',
      propertyType,
      DynamicDtoClass.prototype,
      key,
    );

    const swaggerDecorator = isOptional ? ApiPropertyOptional : ApiProperty;
    swaggerDecorator({
      type: () => propertyType,
      required: !isOptional,
      description,
      example: meta?.example,
    })(DynamicDtoClass.prototype, key);

    for (const dec of decorators) {
      dec(DynamicDtoClass.prototype, key);
    }
  }
  Object.defineProperty(DynamicDtoClass, 'name', { value: className });

  return DynamicDtoClass as unknown as new () => T;
}
