import { SmockVMManager } from '../types';
import { fromHexString, remove0x, toFancyAddress, toHexString } from '../utils';
import { decodeVariable, getVariableStorageSlots, StorageSlotKeyValuePair } from '../utils/storage';

export class ReadableStorageLogic {
  private storageLayout: any;
  private contractAddress: string;
  private vmManager: SmockVMManager;

  constructor(storageLayout: any, vmManager: SmockVMManager, contractAddress: string) {
    this.storageLayout = storageLayout;
    this.vmManager = vmManager;
    this.contractAddress = contractAddress;
  }

  async getVariable(variableName: string, mappingKey?: string | number): Promise<any> {
    const slots = await getVariableStorageSlots(this.storageLayout, variableName, this.vmManager, this.contractAddress, mappingKey);

    let slotValueTypePairs: StorageSlotKeyValuePair[] = [];

    for (const slotKeyPair of slots) {
      slotValueTypePairs = slotValueTypePairs.concat({
        value: remove0x(
          toHexString(await this.vmManager.getContractStorage(toFancyAddress(this.contractAddress), fromHexString(slotKeyPair.key)))
        ),
        type: slotKeyPair.type,
        length: slotKeyPair.length,
        label: slotKeyPair.label,
        offset: slotKeyPair.offset,
      });
    }

    const result = decodeVariable(slotValueTypePairs);

    return result;
  }
}
