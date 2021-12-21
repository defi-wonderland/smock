import { ethers } from 'ethers';

const proto = Object.prototype;
const gpo = Object.getPrototypeOf;

/**
 * Convert structs into Plain Old Javascript Objects in a recursive manner
 *
 * @param struct Struct to convert
 * @returns Struct as POJO
 */
export function convertStructToPojo(struct: any): object {
  let obj: { [key: string]: unknown } = {};

  Object.entries(struct)
    .slice(struct.length)
    .forEach(([key, value]) => {
      obj[key] = isStruct(value) ? convertStructToPojo(value) : value;
    });

  return obj;
}

export function convertPojoToStruct(value: Record<string, unknown>, fnFragment: ethers.utils.FunctionFragment): unknown[] {
  const parsedValue = {
    [fnFragment.name]: value,
  };
  const parsedFnFragment: Partial<ethers.utils.ParamType> = {
    name: fnFragment.name,
    components: fnFragment.outputs!,
  };

  return convertPojoToStructRecursive(parsedValue, [parsedFnFragment])[0];
}

export function convertPojoToStructRecursive(value: any, fnFragments: Partial<ethers.utils.ParamType>[]): unknown[][] {
  let res: unknown[][] = [];

  fnFragments.forEach((item) => {
    if (item.components) {
      res.push(convertPojoToStructRecursive(value[item.name!], item.components));
    } else {
      res.push(value[item.name!]);
    }
  });

  return res;
}

export function getObjectAndStruct(obj1: unknown, obj2: unknown): [object, unknown[]] | undefined {
  if (isPojo(obj1) && isStruct(obj2)) {
    return [obj1 as object, obj2 as unknown[]];
  }
  if (isPojo(obj2) && isStruct(obj1)) {
    return [obj2 as object, obj1 as unknown[]];
  }
  return;
}

/**
 * Detect if an object is an struct or not
 * Solidity converts objects into structs by turning them into "object array"
 * For example: { hello: true }
 * Will look like: [true, hello: true], you might say: an array with properties in it?! yes, exactly that
 *
 * If you look at the length of the array, it will give you 1, but looking at the keys will return:
 * [true, 'hello']
 * So if the length of the keys is larger than the length of the object, we might asume it is a Struct
 *
 * @param obj Object to evaluate
 * @returns Whether or not the object is a struct
 */
export function isStruct(obj: unknown) {
  return Array.isArray(obj) && Object.keys(obj).length > obj.length;
}

export function isPojo(obj: unknown): boolean {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }
  return gpo(obj) === proto;
}
