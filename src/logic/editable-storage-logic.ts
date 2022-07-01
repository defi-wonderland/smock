import { SetVariablesType, SmockVMManager } from '../types';
import { fromHexString, remove0x, toFancyAddress, toHexString } from '../utils';
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
      let prevStorageValue = await this.vmManager.getContractStorage(toFancyAddress(this.contractAddress), fromHexString(slot.key));
      let stringValue = remove0x(toHexString(prevStorageValue));
      if (stringValue && (slot.type === 'address' || slot.type === 'bool' || slot.type.startsWith('contract'))) {
        let lastResult = slot.val.slice(0, slot.val.length - stringValue.length).concat(stringValue);
        await this.vmManager.putContractStorage(toFancyAddress(this.contractAddress), fromHexString(slot.key), fromHexString(lastResult));
      } else {
        await this.vmManager.putContractStorage(toFancyAddress(this.contractAddress), fromHexString(slot.key), fromHexString(slot.val));
      }
    }
  }

  async setVariables(variables: SetVariablesType) {
    if (variables === undefined || variables === null) return;

    for (const [variableName, variableValue] of Object.entries(variables)) {
      await this.setVariable(variableName, variableValue);
    }
  }
}
