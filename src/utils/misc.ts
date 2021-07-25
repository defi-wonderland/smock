import { BigNumber } from 'ethers';
import { isPojo } from './serdes';

const timeWords = [null, 'once', 'twice', 'thrice'];
export function humanizeTimes(count: number) {
  return timeWords[count] || `${count || 0} times`;
}

/**
 * Custom object flatten
 *
 * @param obj Object to flatten.
 * @param prefix Current object prefix (used recursively).
 * @param result Current result (used recursively).
 * @returns Flattened object.
 */
export function flatten(obj: any, prefix: string = '', result: any = {}): Object {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    const subKey = `${prefix}${key}`;

    if (BigNumber.isBigNumber(val) || typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      result[subKey] = val;
    } else if (Array.isArray(val)) {
      val.forEach((valItem, index) => flatten(valItem, !prefix ? `${index}` : `${prefix}${index}.`, acc));
    } else if (isPojo(val)) {
      flatten(val, `${subKey}.`, acc);
    } else {
      throw new Error('Cannot flatten unsupported object type');
    }

    return acc;
  }, result);
}
