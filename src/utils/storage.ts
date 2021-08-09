import { fromHexString, remove0x } from '@eth-optimism/core-utils';
import { BigNumber, ethers } from 'ethers';
import { artifacts } from 'hardhat';
import semver from 'semver';

// Represents the JSON objects outputted by the Solidity compiler that describe the structure of
// state within the contract. See
// https://docs.soliditylang.org/en/v0.8.3/internals/layout_in_storage.html for more information.
interface SolidityStorageObj {
  astId: number;
  contract: string;
  label: string;
  offset: number;
  slot: string;
  type: string;
}

// Represents the JSON objects outputted by the Solidity compiler that describe the types used for
// the various pieces of state in the contract. See
// https://docs.soliditylang.org/en/v0.8.3/internals/layout_in_storage.html for more information.
interface SolidityStorageType {
  encoding: string;
  label: string;
  numberOfBytes: string;
  key?: string;
  value?: string;
  base?: string;
  members?: SolidityStorageObj[];
}

// Container object returned by the Solidity compiler. See
// https://docs.soliditylang.org/en/v0.8.3/internals/layout_in_storage.html for more information.
export interface SolidityStorageLayout {
  storage: SolidityStorageObj[];
  types: {
    [name: string]: SolidityStorageType;
  };
}

interface StorageSlotPair {
  key: string;
  val: string;
}

/**
 * Retrieves the storageLayout portion of the compiler artifact for a given contract by name. This
 * function is hardhat specific.
 *
 * @param hre HardhatRuntimeEnvironment, required for the readArtifactSync function.
 * @param name Name of the contract to retrieve the storage layout for.
 * @return Storage layout object from the compiler output.
 */
export async function getStorageLayout(name: string): Promise<SolidityStorageLayout> {
  const { sourceName, contractName } = await artifacts.readArtifactSync(name);
  const buildInfo = await artifacts.getBuildInfo(`${sourceName}:${contractName}`);
  if (!buildInfo) throw new Error(`Build info not found for contract ${sourceName}:${contractName}`);

  const output = buildInfo.output.contracts[sourceName][contractName];

  if (!semver.satisfies(buildInfo.solcVersion, '>=0.4.x <0.9.x')) {
    throw new Error(`Storage layout for Solidity version ${buildInfo.solcVersion} not yet supported. Sorry!`);
  }

  if (!('storageLayout' in output)) {
    throw new Error(
      `Storage layout for ${name} not found. Did you forget to set the storage layout compiler option in your hardhat config? Read more: https://smock.readthedocs.io/en/latest/getting-started.html#enabling-mocks`
    );
  }

  return (output as any).storageLayout;
}

/**
 * Computes the key/value storage slot pairs that would be used if a given set of variable values
 * were applied to a given contract.
 *
 * @param storageLayout Solidity storage layout to use as a template for determining storage slots.
 * @param variables Variable values to apply against the given storage layout.
 * @returns An array of key/value storage slot pairs that would result in the desired state.
 */
export function computeStorageSlots(storageLayout: SolidityStorageLayout, variables: any = {}): Array<StorageSlotPair> {
  let slots: StorageSlotPair[] = [];
  for (const [variableName, variableValue] of Object.entries(variables)) {
    // Find the entry in the storage layout that corresponds to this variable name.
    const storageObj = storageLayout.storage.find((entry) => {
      return entry.label === variableName;
    });

    // Complain very loudly if attempting to set a variable that doesn't exist within this layout.
    if (!storageObj) {
      throw new Error(`variable name not found in storage layout: ${variableName}`);
    }

    // Encode this variable as series of storage slot key/value pairs and save it.
    slots = slots.concat(encodeVariable(variableValue, storageObj, storageLayout.types));
  }

  // Dealing with packed storage slots now. We know that a storage slot is packed when two storage
  // slots produced by the above encoding have the same key. In this case, we want to merge the two
  // values into a single bytes32 value. We'll throw an error if the two values overlap (have some
  // byte where both values are non-zero).
  slots = slots.reduce((prevSlots: StorageSlotPair[], slot) => {
    // Find some previous slot where we have the same key.
    const prevSlot = prevSlots.find((otherSlot) => {
      return otherSlot.key === slot.key;
    });

    if (prevSlot === undefined) {
      // Slot doesn't share a key with any other slot so we can just push it and continue.
      prevSlots.push(slot);
    } else {
      // Slot shares a key with some previous slot.
      // First, we remove the previous slot from the list of slots since we'll be modifying it.
      prevSlots = prevSlots.filter((otherSlot) => {
        return otherSlot.key !== prevSlot.key;
      });

      // Now we'll generate a merged value by taking the non-zero bytes from both values. There's
      // probably a more efficient way to do this, but this is relatively easy and straightforward.
      let mergedVal = '0x';
      const valA = remove0x(slot.val);
      const valB = remove0x(prevSlot.val);
      for (let i = 0; i < 64; i += 2) {
        const byteA = valA.slice(i, i + 2);
        const byteB = valB.slice(i, i + 2);

        if (byteA === '00' && byteB === '00') {
          mergedVal += '00';
        } else if (byteA === '00' && byteB !== '00') {
          mergedVal += byteB;
        } else if (byteA !== '00' && byteB === '00') {
          mergedVal += byteA;
        } else {
          // Should never happen, means our encoding is broken. Values should *never* overlap.
          throw new Error('detected badly encoded packed value, should not happen');
        }
      }

      prevSlots.push({
        key: slot.key,
        val: mergedVal,
      });
    }

    return prevSlots;
  }, []);

  return slots;
}

/**
 * Takes a slot value (in hex), left-pads it with zeros, and displaces it by a given offset.
 *
 * @param val Hex string value to pad.
 * @param offset Number of bytes to offset from the right.
 * @return Padded hex string.
 */
function padHexSlotValue(val: string, offset: number): string {
  return (
    '0x' +
    remove0x(val)
      .padStart(64 - offset * 2, '0') // Pad the start with 64 - offset zero bytes.
      .padEnd(64, '0') // Pad the end (up to 64 bytes) with zero bytes.
      .toLowerCase() // Making this lower case makes assertions more consistent later.
  );
}

/**
 * Encodes a single variable as a series of key/value storage slot pairs using some storage layout
 * as instructions for how to perform this encoding. Works recursively with struct types.
 * ref: https://docs.soliditylang.org/en/v0.8.4/internals/layout_in_storage.html#layout-of-state-variables-in-storage
 *
 * @param variable Variable to encode as key/value slot pairs.
 * @param storageObj Solidity compiler JSON output describing the layout for this
 * @param storageTypes Full list of storage types allowed for this encoding.
 * @param nestedSlotOffset Only used for structs. Since slots for struct members are 0-indexed, we
 * need to be keeping track of the slot offset of the parent struct to figure out the final slot.
 * @param baseSlotKey Only used for maps. Keeps track of the base slot that other elements of the
 * mapping need to work off of.
 * @returns Variable encoded as a series of key/value slot pairs.
 */
function encodeVariable(
  variable: any,
  storageObj: SolidityStorageObj,
  storageTypes: {
    [name: string]: SolidityStorageType;
  },
  nestedSlotOffset = 0,
  baseSlotKey?: string
): StorageSlotPair[] {
  let slotKey: string; // bytes32
  if (baseSlotKey !== undefined) {
    // See https://docs.soliditylang.org/en/v0.8.6/internals/layout_in_storage.html#mappings-and-dynamic-arrays
    // for additional information about how mapping keys are determined. Note that baseSlotKey is
    // NEVER defined at the first level of this recursive process. baseSlotKey will ONLY be defined
    // if we're dealing with a mapping. And storageObj.slot will always be set to 0 (see logic for
    // mappings below) unless we're encoding a field of a struct.
    slotKey =
      '0x' +
      remove0x(
        BigNumber.from(baseSlotKey)
          .add(BigNumber.from(parseInt(storageObj.slot, 10)))
          .toHexString()
      ).padStart(64, '0');
  } else {
    // We're dealing with something other than a mapping. nestedSlotOffset only comes into play
    // when dealing with structs. When the variable is not a struct, we're just going to use the
    // slot assigned to that variable (there will not be an offset).
    slotKey =
      '0x' +
      remove0x(
        BigNumber.from(nestedSlotOffset)
          .add(BigNumber.from(parseInt(storageObj.slot, 10)))
          .toHexString()
      ).padStart(64, '0');
  }

  const variableType = storageTypes[storageObj.type];
  if (variableType.encoding === 'inplace') {
    if (variableType.label === 'address' || variableType.label.startsWith('contract')) {
      if (!ethers.utils.isAddress(variable)) {
        throw new Error(`invalid address type: ${variable}`);
      }

      return [
        {
          key: slotKey,
          val: padHexSlotValue(variable, storageObj.offset),
        },
      ];
    } else if (variableType.label === 'bool') {
      // Do some light parsing here to make sure "true" and "false" are recognized.
      if (typeof variable === 'string') {
        if (variable === 'false') {
          variable = false;
        }
        if (variable === 'true') {
          variable = true;
        }
      }

      if (typeof variable !== 'boolean') {
        throw new Error(`invalid bool type: ${variable}`);
      }

      return [
        {
          key: slotKey,
          val: padHexSlotValue(variable ? '1' : '0', storageObj.offset),
        },
      ];
    } else if (variableType.label.startsWith('bytes')) {
      if (!ethers.utils.isHexString(variable, parseInt(variableType.numberOfBytes, 10))) {
        throw new Error(`invalid bytesN type`);
      }

      return [
        {
          key: slotKey,
          val: padHexSlotValue(remove0x(variable).padEnd(parseInt(variableType.numberOfBytes, 10) * 2, '0'), storageObj.offset),
        },
      ];
    } else if (variableType.label.startsWith('uint')) {
      if (remove0x(BigNumber.from(variable).toHexString()).length / 2 > parseInt(variableType.numberOfBytes, 10)) {
        throw new Error(`provided ${variableType.label} is too big: ${variable}`);
      }

      return [
        {
          key: slotKey,
          val: padHexSlotValue(BigNumber.from(variable).toHexString(), storageObj.offset),
        },
      ];
    } else if (variableType.label.startsWith('struct')) {
      // Structs are encoded recursively, as defined by their `members` field.
      let slots: StorageSlotPair[] = [];
      for (const [varName, varVal] of Object.entries(variable)) {
        slots = slots.concat(
          encodeVariable(
            varVal,
            (variableType.members as SolidityStorageObj[]).find((member) => {
              return member.label === varName;
            }) as SolidityStorageObj,
            storageTypes,
            nestedSlotOffset + parseInt(storageObj.slot as any, 10),
            baseSlotKey
          )
        );
      }
      return slots;
    }
  } else if (variableType.encoding === 'bytes') {
    if (storageObj.offset !== 0) {
      // string/bytes types are *not* packed by Solidity.
      throw new Error(`got offset for string/bytes type, should never happen`);
    }

    // `string` types are converted to utf8 bytes, `bytes` are left as-is (assuming 0x prefixed).
    const bytes = storageObj.type === 'string' ? ethers.utils.toUtf8Bytes(variable) : fromHexString(variable);

    // ref: https://docs.soliditylang.org/en/v0.8.4/internals/layout_in_storage.html#bytes-and-string
    if (bytes.length < 32) {
      // NOTE: Solidity docs (see above) specifies that strings or bytes with a length of 31 bytes
      // should be placed into a storage slot where the last byte of the storage slot is the length
      // of the variable in bytes * 2.
      return [
        {
          key: slotKey,
          val: ethers.utils.hexlify(
            ethers.utils.concat([
              ethers.utils.concat([bytes, ethers.constants.HashZero]).slice(0, 31),
              ethers.BigNumber.from(bytes.length * 2).toHexString(),
            ])
          ),
        },
      ];
    } else {
      // TODO: add support for large strings or byte arrays
      throw new Error('large strings (>31 bytes) not supported');
    }
  } else if (variableType.encoding === 'mapping') {
    if (variableType.key === undefined || variableType.value === undefined) {
      // Should never happen in practice but required to maintain proper typing.
      throw new Error(`variable is a mapping but has no key field or has no value field: ${variableType}`);
    }

    let slots: StorageSlotPair[] = [];
    for (const [varName, varVal] of Object.entries(variable)) {
      // Mapping keys are encoded depending on the key type.
      let key: string;
      if (variableType.key.startsWith('t_uint')) {
        key = BigNumber.from(varName).toHexString();
      } else if (variableType.key.startsWith('t_bytes')) {
        key = '0x' + remove0x(varName).padEnd(64, '0');
      } else {
        // Seems to work for everything else.
        key = varName;
      }

      // Figure out the base slot key that the mapped values need to work off of.
      // If baseSlotKey is defined here, then we're inside of a nested mapping and we should work
      // off of that previous baseSlotKey. Otherwise the base slot will be the slot of this map.
      const prevBaseSlotKey = baseSlotKey || padHexSlotValue(BigNumber.from(storageObj.slot).toHexString(), 0);
      const nextBaseSlotKey = ethers.utils.keccak256(padHexSlotValue(key, 0) + remove0x(prevBaseSlotKey));

      // Encode the value. We need to use a dummy storageObj here because the function expects it.
      // Of course, we're not mapping to a specific variable. We map to a variable /type/. So we
      // need a dummy thing to represent a variable of that type.
      slots = slots.concat(
        encodeVariable(
          varVal,
          {
            label: varName,
            offset: 0,
            slot: '0',
            type: variableType.value,
            astId: 0,
            contract: '',
          },
          storageTypes,
          nestedSlotOffset + parseInt(storageObj.slot, 10),
          nextBaseSlotKey
        )
      );
    }
    return slots;
  } else if (variableType.encoding === 'dynamic_array') {
    // TODO: add support for array types
    throw new Error('array types not yet supported');
  }

  throw new Error(`unknown unsupported type ${variableType.encoding} ${variableType.label}`);
}
