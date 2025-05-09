import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { BigNumber } from 'ethers';

export const IsMinMaxNumberString = (
  { min, max }: { min: string; max: string },
  validationOptions?: ValidationOptions,
) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isMinMaxNumberString',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [min, max],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          try {
            const minBN = BigNumber.from(args.constraints[0]);
            const maxBN = BigNumber.from(args.constraints[1]);
            const valueBN = BigNumber.from(value);
            if (valueBN.isNegative() || valueBN.isZero()) {
              return false;
            }

            return valueBN.gte(minBN) && valueBN.lte(maxBN);
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a numeric string greater than  ${args.constraints[0]} and less than ${args.constraints[1]}`;
        },
      },
    });
  };
};
