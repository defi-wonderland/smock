import { SmockVMManager } from '../types';
import { fromHexString, toFancyAddress } from '../utils';
import { computeStorageSlots } from '../utils/storage';

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

    const slots = computeStorageSlots(this.storageLayout, { [variableName]: value });

    for (const slot of slots) {
      await this.vmManager.putContractStorage(toFancyAddress(this.contractAddress), fromHexString(slot.key), fromHexString(slot.val));
    }
  }
}
