import { BigNumber, ethers } from 'ethers';
import { artifacts } from 'hardhat';
import semver from 'semver';
import { SmockVMManager } from '../types';
import { bigNumberToHex, fromHexString, remove0x, toFancyAddress, toHexString, xor } from '../utils';

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

// This object represents the storage slot that a variable is stored (key)
// and the type of the variable (type).
export interface StorageSlotKeyTypePair {
  key: string;
  type: SolidityStorageType;
  length?: number; // used only for bytes type, helps during decoding
  label?: string; // used for structs to get the members key
  offset?: number; // used when we deal with packed variables
}

export interface StorageSlotKeyValuePair {
  value: any;
  type: SolidityStorageType;
  length?: number; // used only for bytes type, helps during decoding
  label?: string; // used for structs to get the members key
  offset?: number; // used when we deal with packed variables
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
      throw new Error(`Variable name not found in storage layout: ${variableName}`);
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
        } else if (byteA === 'ff' && byteB === 'ff') {
          mergedVal += 'ff';
        } else if (byteA === 'ff' && byteB !== '00') {
          mergedVal += byteB;
        } else if (byteA !== '00' && byteB === 'ff') {
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
 * Takes number slot value (in hex), left-pads it with zeros or f (when negative),
 * and displaces it by a given offset.
 *
 * @param val Number to pad.
 * @param offset Number of bytes to offset from the right.
 * @return Padded hex string.
 */
function padNumHexSlotValue(val: any, offset: number): string {
  const bn = BigNumber.from(val);

  return (
    '0x' +
    bigNumberToHex(bn)
      .replace(/^0+/, '')
      .padStart(64 - offset * 2, bn.isNegative() ? 'f' : '0') // Pad the start with 64 - offset bytes
      .padEnd(64, '0') // Pad the end (up to 64 bytes) with zero bytes.
      .toLowerCase() // Making this lower case makes assertions more consistent later.
  );
}

/**
 * Takes bytes slot value (in hex), left-pads it with zeros, and displaces it by a given offset.
 *
 * @param val Hex string value to pad.
 * @param offset Number of bytes to offset from the right.
 * @return Padded hex string.
 */
function padBytesHexSlotValue(val: string, offset: number): string {
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
 * See https://docs.soliditylang.org/en/v0.8.6/internals/layout_in_storage.html#mappings-and-dynamic-arrays for additional info.
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
  let slotKey: string =
    '0x' +
    remove0x(
      BigNumber.from(baseSlotKey || nestedSlotOffset)
        .add(BigNumber.from(parseInt(storageObj.slot, 10)))
        .toHexString()
    ).padStart(64, '0');

  const variableType = storageTypes[storageObj.type];
  if (variableType.encoding === 'inplace') {
    if (variableType.label === 'address' || variableType.label.startsWith('contract')) {
      if (!ethers.utils.isAddress(variable)) {
        throw new Error(`invalid address type: ${variable}`);
      }

      return [
        {
          key: slotKey,
          val: padNumHexSlotValue(variable, storageObj.offset),
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
          val: padNumHexSlotValue(variable ? '1' : '0', storageObj.offset),
        },
      ];
    } else if (variableType.label.startsWith('bytes')) {
      if (!ethers.utils.isHexString(variable, parseInt(variableType.numberOfBytes, 10))) {
        throw new Error(`invalid bytesN type`);
      }

      return [
        {
          key: slotKey,
          val: padBytesHexSlotValue(remove0x(variable).padEnd(parseInt(variableType.numberOfBytes, 10) * 2, '0'), storageObj.offset),
        },
      ];
    } else if (variableType.label.startsWith('uint') || variableType.label.startsWith('int')) {
      let valueLength = remove0x(BigNumber.from(variable).toHexString()).length;
      if (variableType.label.startsWith('int')) {
        valueLength = remove0x(BigNumber.from(variable).toHexString().slice(1)).length;
      }

      if (valueLength / 2 > parseInt(variableType.numberOfBytes, 10)) {
        throw new Error(`provided ${variableType.label} is too big: ${variable}`);
      }

      return [
        {
          key: slotKey,
          val: padNumHexSlotValue(variable, storageObj.offset),
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
      let slots: StorageSlotPair[] = [];
      // According to the solidity docs (https://docs.soliditylang.org/en/v0.8.4/internals/layout_in_storage.html#bytes-and-string)
      // For bytes or strings that store data which is 32 or more bytes long, the main slot p stores length * 2 + 1
      // and the data is stored as usual in keccak256(p)
      slots = slots.concat({
        key: slotKey,
        val: padNumHexSlotValue(bytes.length * 2 + 1, 0),
      });

      // Each storage slot has 32 bytes so we make sure to slice the large bytes into 32bytes chunks
      for (let i = 0; i * 32 < bytes.length; i++) {
        // We calculate the Storage Slot key based on the solidity docs (see above link)
        let key = BigNumber.from(ethers.utils.keccak256(slotKey))
          .add(BigNumber.from(i.toString(16)))
          .toHexString();
        slots = slots.concat({
          key: key,
          val: ethers.utils.hexlify(ethers.utils.concat([bytes.slice(i * 32, i * 32 + 32), ethers.constants.HashZero]).slice(0, 32)),
        });
      }

      return slots;
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
      const prevBaseSlotKey = baseSlotKey || padNumHexSlotValue(storageObj.slot, 0);
      const nextBaseSlotKey = ethers.utils.keccak256(padNumHexSlotValue(key, 0) + remove0x(prevBaseSlotKey));

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
    if (variableType.base === undefined) {
      // Should never happen in practice but required to maintain proper typing.
      throw new Error(`variable is an array but has no base: ${variableType}`);
    }
    // In slotKey we save the length of the array
    let slots: StorageSlotPair[] = [
      {
        key: slotKey,
        val: padNumHexSlotValue(variable.length, 0),
      },
    ];

    let numberOfBytes: number = 0;
    let nextBaseSlotKey = BigNumber.from(ethers.utils.keccak256(slotKey));

    // We need to find the number of bytes the base type has.
    // The `numberOfBytes` variable will help us deal with packed arrays.
    // We should only care for packed values only if the `numberOfBytes` is less than 16 otherwise there is no packing.
    if (variableType.base.startsWith('t_bool')) {
      numberOfBytes = 1;
    } else if (variableType.base.startsWith('t_uint') || variableType.base.startsWith('t_int')) {
      // We find the number of bits from the base and divide it with 8 to get the number of bytes
      numberOfBytes = Number(variableType.base.replace(/\D/g, '')) / 8;
      // If we have more than 16Bytes for each value then we don't care about packed variables.
      numberOfBytes > 16 ? 0 : numberOfBytes;
    }

    let offset: number = -numberOfBytes;
    for (let i = 0; i < variable.length; i++) {
      // If the values are packed then we need to keep track of the offset and when to change slot
      if (numberOfBytes > 0) {
        offset += numberOfBytes;
        if (offset >= 32) {
          offset = 0;
          nextBaseSlotKey = nextBaseSlotKey.add(BigNumber.from(1));
        }
      } else {
        offset = 0;
        nextBaseSlotKey = BigNumber.from(ethers.utils.keccak256(slotKey)).add(BigNumber.from(i.toString(16)));
      }

      slots = slots.concat(
        encodeVariable(
          variable[i],
          {
            label: '',
            offset: offset,
            slot: '0',
            type: variableType.base,
            astId: 0,
            contract: '',
          },
          storageTypes,
          nestedSlotOffset,
          nextBaseSlotKey.toHexString()
        )
      );
    }
    return slots;
  }

  throw new Error(`unknown unsupported type ${variableType.encoding} ${variableType.label}`);
}

/**
 * Computes the slot keys and types of the storage slots that a variable lives
 *
 * @param storageLayout Solidity storage layout to use as a template for determining storage slots.
 * @param variableName Variable name to find against the given storage layout.
 * @param vmManager SmockVMManager is used to get certain storage values given a specific slot key and a contract address
 * @param contractAddress Contract address to use for vmManager
 * @param mappingKey Only used for mappings, represents they key of a mapping value
 * @param baseSlotKey Only used for maps. Keeps track of the base slot that other elements of the
 * mapping need to work off of.
 * @param storageType Only used for nested mappings. Since we can't get the SolidityStorageObj of a nested mapping value
 we need to pass it's SolidityStorageType to work from
 * @returns An array of storage slot key/type pair that would result in the value of the variable.
 */
export async function getVariableStorageSlots(
  storageLayout: SolidityStorageLayout,
  variableName: string,
  vmManager: SmockVMManager,
  contractAddress: string,
  mappingKey?: any[] | number | string,
  baseSlotKey?: string,
  storageType?: SolidityStorageType
): Promise<StorageSlotKeyTypePair[]> {
  // Find the entry in the storage layout that corresponds to this variable name.
  const storageObj = storageLayout.storage.find((entry) => {
    return entry.label === variableName;
  });

  // Complain very loudly if attempting to get a variable that doesn't exist within this layout.
  if (!storageObj) {
    throw new Error(`Variable name not found in storage layout: ${variableName}`);
  }

  const storageObjectType: SolidityStorageType = storageType || storageLayout.types[storageObj.type];

  // Here we will store all the key/type pairs that we need to get the variable's value
  let slotKeysTypes: StorageSlotKeyTypePair[] = [];
  let key: string =
    baseSlotKey ||
    '0x' +
      remove0x(
        BigNumber.from(0)
          .add(BigNumber.from(parseInt(storageObj.slot, 10)))
          .toHexString()
      ).padStart(64, '0');

  if (storageObjectType.encoding === 'inplace') {
    // For `inplace` encoding we only need to be aware of structs where they take more slots to store a variable
    if (storageObjectType.label.startsWith('struct')) {
      slotKeysTypes = getStructTypeStorageSlots(storageLayout, key, storageObjectType, storageObj);
    } else {
      // In cases we deal with other types than structs we already know the slot key and type
      slotKeysTypes = slotKeysTypes.concat({
        key: key,
        type: storageObjectType,
        offset: storageObj.offset,
        label: storageObj.label,
      });
    }
  } else if (storageObjectType.encoding === 'bytes') {
    slotKeysTypes = await getBytesTypeStorageSlots(vmManager, contractAddress, storageObjectType, storageObj, key);
  } else if (storageObjectType.encoding === 'mapping') {
    if (mappingKey === undefined) {
      // Throw an error if the user didn't provide a mappingKey
      throw new Error(`Mapping key must be provided to get variable value: ${variableName}`);
    }
    slotKeysTypes = await getMappingTypeStorageSlots(
      storageLayout,
      variableName,
      vmManager,
      contractAddress,
      key,
      storageObjectType,
      mappingKey
    );
  } else if (storageObjectType.encoding === 'dynamic_array') {
    slotKeysTypes = await getDynamicArrayTypeStorageSlots(vmManager, contractAddress, storageObjectType, key);
  }

  return slotKeysTypes;
}

function getStructTypeStorageSlots(
  storageLayout: SolidityStorageLayout,
  key: string,
  storageObjectType: SolidityStorageType,
  storageObj: SolidityStorageObj
): StorageSlotKeyTypePair[] {
  if (storageObjectType.members === undefined) {
    throw new Error(`There are no members in object type ${storageObjectType}`);
  }

  let slotKeysTypes: StorageSlotKeyTypePair[] = [];
  // Slot key that represents the struct
  slotKeysTypes = slotKeysTypes.concat({
    key: key,
    type: storageObjectType,
    label: storageObj.label,
    offset: storageObj.offset,
  });

  // These slots are for the members of the struct
  slotKeysTypes = slotKeysTypes.concat(
    storageObjectType.members.map((member) => ({
      key: '0x' + remove0x(BigNumber.from(key).add(BigNumber.from(member.slot)).toHexString()).padStart(64, '0'),
      type: storageLayout.types[member.type],
      label: member.label,
      offset: member.offset,
    }))
  );

  return slotKeysTypes;
}

async function getBytesTypeStorageSlots(
  vmManager: SmockVMManager,
  contractAddress: string,
  storageObjectType: SolidityStorageType,
  storageObj: SolidityStorageObj,
  key: string
): Promise<StorageSlotKeyTypePair[]> {
  let slotKeysTypes: StorageSlotKeyTypePair[] = [];
  // The last 2 bytes of the slot represent the length of the string/bytes variable
  // If it's bigger than 31 then we have to deal with a long string/bytes array
  const bytesValue = toHexString(await vmManager.getContractStorage(toFancyAddress(contractAddress), fromHexString(key)));
  // It is known that if the last byte is set then we are dealing with a long string
  // if it is 0 then we are dealing with a short string, you can find more details here (https://docs.soliditylang.org/en/v0.8.15/internals/layout_in_storage.html#bytes-and-string)
  if (bytesValue.slice(-1) === '1') {
    // We calculate the total number of slots that this long string/bytes use
    const numberOfSlots = Math.ceil((parseInt(bytesValue, 16) - 1) / 32);
    // Since we are dealing with bytes, their values are stored contiguous
    // we are storing their slotkeys, type and the length which will help us in `decodeVariable`
    for (let i = 0; i < numberOfSlots; i++) {
      slotKeysTypes = slotKeysTypes.concat({
        key: ethers.utils.keccak256(key) + i,
        type: storageObjectType,
        length: i + 1 <= numberOfSlots ? 32 : (parseInt(bytesValue, 16) - 1) % 32,
        label: storageObj.label,
        offset: storageObj.offset,
      });
    }
  } else {
    // If we are dealing with a short string/bytes then we already know the slotkey, type & length
    slotKeysTypes = slotKeysTypes.concat({
      key: key,
      type: storageObjectType,
      length: parseInt(bytesValue.slice(-2), 16),
      label: storageObj.label,
      offset: storageObj.offset,
    });
  }

  return slotKeysTypes;
}

async function getMappingTypeStorageSlots(
  storageLayout: SolidityStorageLayout,
  variableName: string,
  vmManager: SmockVMManager,
  contractAddress: string,
  key: string,
  storageObjectType: SolidityStorageType,
  mappingKey: any[] | number | string,
  baseSlotKey?: string
): Promise<StorageSlotKeyTypePair[]> {
  if (storageObjectType.key === undefined || storageObjectType.value === undefined) {
    // Should never happen in practice but required to maintain proper typing.
    throw new Error(`Variable is a mapping but has no key field or has no value field: ${storageObjectType}`);
  }
  mappingKey = mappingKey instanceof Array ? mappingKey : [mappingKey];
  // In order to find the value's storage slot we need to calculate the slot key
  // The slot key for a mapping is calculated like `keccak256(h(k) . p)` for more information (https://docs.soliditylang.org/en/v0.8.15/internals/layout_in_storage.html#mappings-and-dynamic-arrays)
  // In this part we calculate the `h(k)` where k is the mapping key the user provided and h is a function that is applied to the key depending on its type
  let mappKey: string;
  if (storageObjectType.key.startsWith('t_uint')) {
    mappKey = BigNumber.from(mappingKey[0]).toHexString();
  } else if (storageObjectType.key.startsWith('t_bytes')) {
    mappKey = '0x' + remove0x(mappingKey[0] as string).padEnd(64, '0');
  } else {
    // Seems to work for everything else.
    mappKey = mappingKey[0] as string;
  }

  // Figure out the base slot key that the mapped values need to work off of.
  // If baseSlotKey is defined here, then we're inside of a nested mapping and we should work
  // off of that previous baseSlotKey. Otherwise the base slot will be the key we already have.
  const prevBaseSlotKey = baseSlotKey || key;
  // Since we have `h(k) = mappKey` and `p = key` now we can calculate the slot key
  let nextSlotKey = ethers.utils.keccak256(padNumHexSlotValue(mappKey, 0) + remove0x(prevBaseSlotKey));

  let slotKeysTypes: StorageSlotKeyTypePair[] = [];

  mappingKey.shift();
  slotKeysTypes = slotKeysTypes.concat(
    await getVariableStorageSlots(
      storageLayout,
      variableName,
      vmManager,
      contractAddress,
      mappingKey,
      nextSlotKey,
      storageLayout.types[storageObjectType.value]
    )
  );

  return slotKeysTypes;
}

async function getDynamicArrayTypeStorageSlots(
  vmManager: SmockVMManager,
  contractAddress: string,
  storageObjectType: SolidityStorageType,
  key: string
): Promise<StorageSlotKeyTypePair[]> {
  let slotKeysTypes: StorageSlotKeyTypePair[] = [];
  // We know that the array length is stored in position `key`
  let arrayLength = parseInt(toHexString(await vmManager.getContractStorage(toFancyAddress(contractAddress), fromHexString(key))), 16);

  // The values of the array are stored in `keccak256(key)` where key is the storage location of the array
  key = ethers.utils.keccak256(key);
  for (let i = 0; i < arrayLength; i++) {
    // Array values are stored contiguous so we need to calculate the new slot keys in each iteration
    let slotKey = BigNumber.from(key)
      .add(BigNumber.from(i.toString(16)))
      .toHexString();
    slotKeysTypes = slotKeysTypes.concat({
      key: slotKey,
      type: storageObjectType,
    });
  }

  return slotKeysTypes;
}

/**
 * Decodes a single variable from a series of key/value storage slot pairs. Using some storage layout
 * as instructions for how to perform this decoding. Works recursively with struct and array types.
 * ref: https://docs.soliditylang.org/en/v0.8.4/internals/layout_in_storage.html#layout-of-state-variables-in-storage
 *
 * @param slotValueTypePairs StorageSlotKeyValuePairs to decode.
 * @returns Variable decoded.
 */
export function decodeVariable(slotValueTypePairs: StorageSlotKeyValuePair | StorageSlotKeyValuePair[]): any {
  slotValueTypePairs = slotValueTypePairs instanceof Array ? slotValueTypePairs : [slotValueTypePairs];
  let result: string | any = '';
  const numberOfBytes = parseInt(slotValueTypePairs[0].type.numberOfBytes) * 2;
  if (slotValueTypePairs[0].type.encoding === 'inplace') {
    if (slotValueTypePairs[0].type.label === 'address' || slotValueTypePairs[0].type.label.startsWith('contract')) {
      result = ethers.utils.getAddress('0x' + slotValueTypePairs[0].value.slice(0, numberOfBytes));
    } else if (slotValueTypePairs[0].type.label === 'bool') {
      result = slotValueTypePairs[0].value.slice(0, numberOfBytes) === '01' ? true : false;
    } else if (slotValueTypePairs[0].type.label.startsWith('bytes')) {
      result = '0x' + slotValueTypePairs[0].value.slice(0, numberOfBytes);
    } else if (slotValueTypePairs[0].type.label.startsWith('uint')) {
      let value = slotValueTypePairs[0].value;
      if (slotValueTypePairs[0].offset !== 0 && slotValueTypePairs[0].offset !== undefined) {
        value = value.slice(-slotValueTypePairs[0].type.numberOfBytes * 2 - slotValueTypePairs[0].offset * 2, -slotValueTypePairs[0].offset * 2);
      }
      // When we deal with uint we can just return the number
      result = BigNumber.from('0x' + value);
    } else if (slotValueTypePairs[0].type.label.startsWith('int')) {
      // When we deal with signed integers we have to convert the value from signed hex to decimal

      let intHex = slotValueTypePairs[0].value;
      // If the first character is `f` then we know we have to deal with a negative number
      if (intHex.slice(0, 1) === 'f') {
        // In order to get the negative number we need to find the two's complement of the hex value (more info: https://en.wikipedia.org/wiki/Two%27s_complement)
        // To do that we have to XOR our hex with the appropriate mask and then add 1 to the result
        // First convert the hexStrings to Buffer in order to XOR them
        intHex = fromHexString('0x' + intHex);
        // We choose this mask because we want to flip all the hex bytes in order to find the two's complement
        const mask = fromHexString('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
        // After the XOR and the addition we have the positive number of the original hex value, we want the negative value so we add `-` infront
        intHex = -BigNumber.from(toHexString(xor(intHex, mask))).add(BigNumber.from(1));
      }

      result = intHex;
    } else if (slotValueTypePairs[0].type.label.startsWith('struct')) {
      // We remove the first pair since we only need the members now
      slotValueTypePairs.shift();
      let structObject = {};
      for (const member of slotValueTypePairs) {
        if (member.label === undefined) {
          // Should never happen in practice but required to maintain proper typing.
          throw new Error(`label for ${member} is undefined`);
        }

        if (member.offset === undefined) {
          // Should never happen in practice but required to maintain proper typing.
          throw new Error(`offset for ${member} is undefined`);
        }

        let value;
        // If we are dealing with string/bytes we need to decode based on big endian
        // otherwise values are stored as little endian so we have to decode based on that
        // We use the `offset` and `numberOfBytes` to deal with packed variables
        if (member.type.label.startsWith('bytes')) {
          value = member.value.slice(member.offset * 2, parseInt(member.type.numberOfBytes) * 2 + member.offset * 2);
        } else {
          if (member.offset === 0) value = member.value.slice(-member.type.numberOfBytes * 2);
          else value = member.value.slice(-member.type.numberOfBytes * 2 - member.offset * 2, -member.offset * 2);
        }

        structObject = Object.assign(structObject, {
          [member.label]: decodeVariable({
            value: value,
            type: member.type,
          } as StorageSlotKeyValuePair),
        });
        result = structObject;
      }
    }
  } else if (slotValueTypePairs[0].type.encoding === 'bytes') {
    for (const slotKeyPair of slotValueTypePairs) {
      if (slotKeyPair.length === undefined) {
        // Should never happen in practice but required to maintain proper typing.
        throw new Error(`length is undefined for bytes: ${slotValueTypePairs[0]}`);
      }
      if (slotKeyPair.length < 32) {
        result = '0x' + result.concat(slotKeyPair.value.slice(0, slotKeyPair.length));
      } else {
        result = remove0x(result);
        result = '0x' + result.concat(slotKeyPair.value.slice(0, 32));
      }
    }
  } else if (slotValueTypePairs[0].type.encoding === 'mapping') {
    // Should never happen in practise since mappings are handled based on a certain mapping key
    throw new Error(`Error in decodeVariable. Encoding: mapping.`);
  } else if (slotValueTypePairs[0].type.encoding === 'dynamic_array') {
    let arr: any[] = [];
    for (let i = 0; i < slotValueTypePairs.length; i++) {
      arr = arr.concat(
        decodeVariable({
          value: slotValueTypePairs[i].value,
          type: {
            encoding: 'inplace',
            label: slotValueTypePairs[i].type.label,
            numberOfBytes: slotValueTypePairs[i].type.numberOfBytes,
          },
        })
      );
    }
    result = arr;
  }

  return result;
}
