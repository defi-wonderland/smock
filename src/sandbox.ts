import { Address } from '@nomicfoundation/ethereumjs-util';
import { FactoryOptions } from '@nomiclabs/hardhat-ethers/types';
import { BaseContract, ContractFactory, ethers } from 'ethers';
import hre from 'hardhat';
import { ethersInterfaceFromSpec } from './factories/ethers-interface';
import { createFakeContract, createMockContractFactory } from './factories/smock-contract';
import { ProgrammableFunctionLogic } from './logic/programmable-function-logic';
import { ObservableVM } from './observable-vm';
import { CallOverrideCallback, EDRProvider, FakeContract, FakeContractOptions, FakeContractSpec, MockContractFactory } from './types';
import { getHardhatBaseProvider, makeRandomAddress } from './utils';

// Handle hardhat ^2.4.0
let decodeRevertReason: (value: Buffer) => string;
try {
  decodeRevertReason = require('hardhat/internal/hardhat-network/stack-traces/revert-reasons').decodeRevertReason;
} catch (err) {
  const { ReturnData } = require('hardhat/internal/hardhat-network/provider/return-data');
  decodeRevertReason = (value: Buffer) => {
    const returnData = new ReturnData(value);
    return returnData.isErrorReturnData() ? returnData.decodeError() : '';
  };
}

// Handle hardhat ^2.2.0
let TransactionExecutionError: any;
try {
  TransactionExecutionError = require('hardhat/internal/hardhat-network/provider/errors').TransactionExecutionError;
} catch (err) {
  TransactionExecutionError = require('hardhat/internal/core/providers/errors').TransactionExecutionError;
}

export class Sandbox {
  private vm: ObservableVM;
  private static nonce: number = 0;
  private addressToSighashToFunction: Map<string, Map<string | null, ProgrammableFunctionLogic>> = new Map();

  constructor(provider: EDRProvider) {
    this.vm = new ObservableVM(provider._node._vm);

    provider._setCallOverrideCallback((address, data) => this.overrideCall(address, data));
  }

  private async overrideCall(address: Buffer, data: Buffer): ReturnType<CallOverrideCallback> {
    const calledFunction = this.getCalledFunction(address, data);

    const encodedCallAnswer = await calledFunction?.getEncodedCallAnswer(data);

    if (encodedCallAnswer === undefined) {
      return undefined;
    }

    const [result, shouldRevert] = encodedCallAnswer;

    return {
      result,
      shouldRevert,
    };
  }

  private getCalledFunction(address: Buffer, data: Buffer): ProgrammableFunctionLogic | null {
    const addressKey = new Address(address).toString().toLowerCase();

    const sighashToFunction = this.addressToSighashToFunction.get(addressKey);
    if (data.length >= 4) {
      const sighash = '0x' + data.slice(0, 4).toString('hex');
      const sighashKey = sighash.toLowerCase();

      return sighashToFunction?.get(sighashKey) || null;
    }

    return sighashToFunction?.get(null) || null;
  }

  private addFunctionToMap(address: string, sighash: string | null, functionLogic: ProgrammableFunctionLogic): void {
    const addressKey = address.toLowerCase();
    const sighashKey = sighash === null ? null : sighash.toLowerCase();

    let sighashToFunction = this.addressToSighashToFunction.get(addressKey);
    if (sighashToFunction === undefined) {
      sighashToFunction = new Map();
      this.addressToSighashToFunction.set(addressKey, sighashToFunction);
    }

    sighashToFunction.set(sighashKey, functionLogic);
  }

  async fake<Type extends BaseContract>(spec: FakeContractSpec, opts: FakeContractOptions = {}): Promise<FakeContract<Type>> {
    return createFakeContract(
      this.vm,
      opts.address || makeRandomAddress(),
      await ethersInterfaceFromSpec(spec),
      opts.provider || hre.ethers.provider,
      (address, sighash, functionLogic) => this.addFunctionToMap(address, sighash, functionLogic)
    );
  }

  async mock<T extends ContractFactory>(
    contractName: string,
    signerOrOptions?: ethers.Signer | FactoryOptions
  ): Promise<MockContractFactory<T>> {
    return createMockContractFactory(
      this.vm,
      contractName,
      (address, sighash, functionLogic) => this.addFunctionToMap(address, sighash, functionLogic),
      signerOrOptions
    );
  }

  static async create(): Promise<Sandbox> {
    // Only support native hardhat runtime, haven't bothered to figure it out for anything else.
    if (hre.network.name !== 'hardhat') {
      throw new Error(
        `Smock is only compatible with the "hardhat" network, got: ${hre.network.name}. Follow this issue for more info: https://github.com/defi-wonderland/smock/issues/29`
      );
    }

    const provider: any = await getHardhatBaseProvider(hre);
    const node = provider._node;

    // Initialize VM it case it hasn't been already
    if (node === undefined) {
      await provider._init();
    }

    return new Sandbox(provider);
  }

  static getNextNonce(): number {
    return Sandbox.nonce++;
  }
}
