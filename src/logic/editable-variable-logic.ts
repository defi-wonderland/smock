import { LoptVMManager } from '../types';
import { fromHexString, getStorageSlots, toFancyAddress } from '../utils';

export class EditableVariableLogic {
  private storageLayout: any;
  private contractAddress: string;
  private vmManager: LoptVMManager;

  constructor(storageLayout: any, vmManager: LoptVMManager, contractAddress: string) {
    this.storageLayout = storageLayout;
    this.vmManager = vmManager;
    this.contractAddress = contractAddress;
  }

  async set(variableName: string, value: any) {
    if (value === undefined || value === null) return;

    const slots = getStorageSlots(this.storageLayout, variableName, value);

    for (const slot of slots) {
      await this.vmManager.putContractStorage(
        toFancyAddress(this.contractAddress),
        fromHexString(slot.hash.toLowerCase()),
        fromHexString(slot.value)
      );
    }
  }
}
