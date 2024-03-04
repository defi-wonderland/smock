import { stripZeros } from 'ethers/lib/utils';
import { SmockVMManager } from '../types';
import { fromHexString, remove0x, toFancyAddress, toHexString } from '../utils';
import {
  decodeVariable,
  getVariableStorageSlots,
  SolidityStorageLayout,
  StorageSlotKeyTypePair,
  StorageSlotKeyValuePair,
} from '../utils/storage';

export class ReadableStorageLogic {
  private storageLayout: SolidityStorageLayout;
  private contractAddress: string;
  private vmManager: SmockVMManager;

  constructor(storageLayout: SolidityStorageLayout, vmManager: SmockVMManager, contractAddress: string) {
    this.storageLayout = storageLayout;
    this.vmManager = vmManager;
    this.contractAddress = contractAddress;
  }

  async getVariable(variableName: string, mappingKeys?: string[] | number[]): Promise<unknown> {
    const slots: StorageSlotKeyTypePair[] = await getVariableStorageSlots(
      this.storageLayout,
      variableName,
      this.vmManager,
      this.contractAddress,
      mappingKeys
    );
    const slotValueTypePairs: StorageSlotKeyValuePair[] = await Promise.all(
      slots.map(async (slotKeyPair) => ({
        ...slotKeyPair,
        value: remove0x(
          toHexString(
            Buffer.from(
              stripZeros(await this.vmManager.getContractStorage(toFancyAddress(this.contractAddress), fromHexString(slotKeyPair.key)))
            )
          )
        ),
      }))
    );
    return decodeVariable(slotValueTypePairs);
  }
}
