/* External Imports */
import { BigNumber } from 'ethers';

export const toHexString32 = (value: string | number | BigNumber | boolean): string => {
  if (typeof value === 'string' && value.startsWith('0x')) {
    // Known bug here is that bytes20 and address are indistinguishable but have to be treated
    // differently. Address gets padded on the right, bytes20 gets padded on the left. Address is
    // way more common so I'm going with the strategy of treating all bytes20 like addresses.
    // Sorry to anyone who wants to smodify bytes20 values :-/ requires a bit of rewrite to fix.
    if (value.length === 42) {
      return '0x' + remove0x(value).padStart(64, '0').toLowerCase();
    } else {
      return '0x' + remove0x(value).padEnd(64, '0').toLowerCase();
    }
  } else if (typeof value === 'boolean') {
    return '0x' + `${value ? 1 : 0}`.padStart(64, '0');
  } else {
    return '0x' + remove0x(BigNumber.from(value).toHexString()).padStart(64, '0').toLowerCase();
  }
};

/**
 * Casts a hex string to a buffer.
 * @param inp Input to cast to a buffer.
 * @return Input cast as a buffer.
 */
export const fromHexString = (inp: Buffer | string): Buffer => {
  if (typeof inp === 'string' && inp.startsWith('0x')) {
    return Buffer.from(inp.slice(2), 'hex');
  }

  return Buffer.from(inp);
};

/**
 * Casts an input to a hex string.
 * @param inp Input to cast to a hex string.
 * @return Input cast as a hex string.
 */
export const toHexString = (inp: Buffer | string | number): string => {
  if (typeof inp === 'number') {
    return BigNumber.from(inp).toHexString();
  } else {
    return '0x' + fromHexString(inp).toString('hex');
  }
};

/**
 * Removes "0x" from start of a string if it exists.
 * @param str String to modify.
 * @returns the string without "0x".
 */
export const remove0x = (str: string): string => {
  if (str === undefined) {
    return str;
  }
  return str.startsWith('0x') ? str.slice(2) : str;
};

/**
 * Turn big numbers into hex (positive and negative)
 * Source: https://coolaj86.com/articles/convert-decimal-to-hex-with-js-bigints/
 * @param bn big number to parse
 * @returns hex representation of the big number
 */
export function bigNumberToHex(bn: BigNumber) {
  let bi = BigInt(bn.toBigInt());

  var pos = true;
  if (bi < 0) {
    pos = false;
    bi = bitnot(bi);
  }

  var hex = bi.toString(16);
  if (hex.length % 2) {
    hex = '0' + hex;
  }

  if (pos && 0x80 & parseInt(hex.slice(0, 2), 16)) {
    hex = '00' + hex;
  }

  return hex;
}

function bitnot(bi: BigInt) {
  var bin = (-bi).toString(2);
  var prefix = '';
  while (bin.length % 8) {
    bin = '0' + bin;
  }
  if ('1' === bin[0] && -1 !== bin.slice(1).indexOf('1')) {
    prefix = '11111111';
  }
  bin = bin
    .split('')
    .map(function (i) {
      return '0' === i ? '1' : '0';
    })
    .join('');
  return BigInt('0b' + prefix + bin) + BigInt(1);
}
