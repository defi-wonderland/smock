import { SmockVMManager } from '../types';
import { convertToStorageSlots, fromHexString, toFancyAddress } from '../utils';

export class EditableStorageLogic {
  private storageLayout: any;
  private contractAddress: string;
  private vmManager: SmockVMManager;

  constructor(storageLayout: any, vmManager: SmockVMManager, contractAddress: string) {
    this.storageLayout = storageLayout;
    this.vmManager = vmManager;
    this.contractAddress = contractAddress;
  }

  async setVariable(variableName: string, value: any) {
    if (value === undefined || value === null) return;

    const slots = convertToStorageSlots(this.storageLayout, variableName, value);

    for (const slot of slots) {
      await this.vmManager.putContractStorage(
        toFancyAddress(this.contractAddress),
        fromHexString(slot.hash.toLowerCase()),
        fromHexString(slot.value)
      );
    }
  }
}
