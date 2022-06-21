import { SetVariablesType, SmockVMManager } from '../types';
import { fromHexString, toFancyAddress } from '../utils';
import { computeStorageSlots, SolidityStorageLayout } from '../utils/storage';

export class EditableStorageLogic {
  private storageLayout: SolidityStorageLayout;
  private contractAddress: string;
  private vmManager: SmockVMManager;

  constructor(storageLayout: SolidityStorageLayout, vmManager: SmockVMManager, contractAddress: string) {
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

  async setVariables(variables: SetVariablesType) {
    if (variables === undefined || variables === null) return;

    for (const [variableName, variableValue] of Object.entries(variables)) {
      await this.setVariable(variableName, variableValue);
    }
  }
}
