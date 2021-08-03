import hre, { ethers } from 'hardhat';
import { Artifacts } from 'hardhat/internal/artifacts';
import { remove0x, toHexString32 } from './hex-utils';
import { flatten } from './misc';

interface InputSlot {
  label: string;
  slot: number;
}

interface StorageSlot {
  label: string;
  hash: string;
  value: string;
}

/**
 * Reads the storage layout of a contract.
 *
 * @param name Name of the contract to get a storage layout for.
 * @return Storage layout for the given contract name.
 */
export const getStorageLayout = async (name: string): Promise<any> => {
  const artifacts = new Artifacts(hre.config.paths.artifacts);
  const { sourceName, contractName } = artifacts.readArtifactSync(name);
  const buildInfo = await hre.artifacts.getBuildInfo(`${sourceName}:${contractName}`);
  if (!buildInfo) {
    throw new Error(`Failed to find contract ${sourceName}:${contractName}`);
  }

  const output = buildInfo.output.contracts[sourceName][contractName];
  if (!('storageLayout' in output)) {
    throw new Error(
      `Storage layout for ${name} not found. Did you forget to set the storage layout compiler option in your hardhat config? Read more: https://github.com/ethereum-optimism/smock#note-on-using-smoddit`
    );
  }

  return (output as any).storageLayout;
};

/**
 * Converts storage into a list of storage slots.
 *
 * @param storageLayout Contract storage layout.
 * @param obj Storage object to convert.
 * @returns List of storage slots.
 */
export const convertToStorageSlots = (storageLayout: any, variableName: string, value: any): StorageSlot[] => {
  const slots: StorageSlot[] = [];

  const variableDef = storageLayout.storage.find((vDef: any) => vDef.label === variableName);
  if (!variableDef) throw new Error(`Could not find a matching variable definition for ${variableName}`);

  const baseSlot = parseInt(variableDef.slot, 10);
  const baseDepth = (variableDef.type.match(/t_mapping/g) || []).length;

  Object.entries(flatten({ [variableName]: value })).forEach(([key, value]) => {
    const path = key.split('.');

    const slotLabel = path.length > 1 + baseDepth ? path[path.length - 1] : 'default';

    const inputSlot = getInputSlots(storageLayout, variableDef.type).find((iSlot) => iSlot.label === slotLabel);
    if (!inputSlot) throw new Error(`Could not find a matching slot definition for ${slotLabel}`);

    let slotHash = toHexString32(baseSlot);
    for (let i = 0; i < baseDepth; i++) {
      slotHash = ethers.utils.keccak256(toHexString32(path[i + 1]) + remove0x(slotHash));
    }

    slotHash = toHexString32(ethers.BigNumber.from(slotHash).add(inputSlot.slot));
    const slotValue = toHexString32(`0x` + toHexString32(value).slice(2 + variableDef.offset * 2));

    slots.push({
      label: key,
      hash: slotHash,
      value: slotValue,
    });
  });

  return slots;
};

/**
 * Gets the slot positions for a provided variable type.
 *
 * @param storageLayout Contract's storage layout.
 * @param inputTypeName Variable type name.
 * @returns Slot positions.
 */
const getInputSlots = (storageLayout: any, inputTypeName: string): InputSlot[] => {
  const inputType = storageLayout.types[inputTypeName];

  if (inputType.encoding === 'mapping') {
    return getInputSlots(storageLayout, inputType.value);
  } else if (inputType.encoding === 'inplace') {
    if (inputType.members) {
      return inputType.members.map((member: any) => {
        return {
          label: member.label,
          offset: member.offset,
          slot: member.slot,
        };
      });
    } else {
      return [
        {
          label: 'default',
          slot: 0,
        },
      ];
    }
  } else {
    throw new Error(`Encoding type not supported: ${inputType.encoding}`);
  }
};
