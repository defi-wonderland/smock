/* Imports: External */
import { Fragment, Interface, JsonFragment } from '@ethersproject/abi';
import { Provider } from '@ethersproject/abstract-provider';
import { Signer } from '@ethersproject/abstract-signer';
import { BaseContract, ContractFactory, ethers } from 'ethers';
import { EditableStorageLogic } from './logic/editable-storage-logic';
import { WatchableFunctionLogic } from './logic/watchable-function-logic';

type Abi = ReadonlyArray<Fragment | JsonFragment | string>;
export type FakeContractSpec = { abi?: Abi; interface?: Interface } | Abi | ethers.utils.Interface | string;

export interface FakeContractOptions {
  provider?: Provider;
  address?: string;
}

export type ProgrammedReturnValue = any;

export interface SmockVMManager {
  putContractCode: (address: Buffer, code: Buffer) => Promise<void>;
  getContractStorage: (address: Buffer, slotHash: Buffer) => Promise<Buffer>;
  putContractStorage: (address: Buffer, slotHash: Buffer, slotValue: Buffer) => Promise<void>;
}

export interface WatchableContractFunction {
  _watchable: WatchableFunctionLogic;
  atCall: (index: number) => WatchableFunctionLogic;
  getCall: (index: number) => ContractCall;
}

export interface ContractCall {
  args: unknown[] | string;
  nonce: number;
  target: string;
}

export type WhenCalledWithChain = {
  returns: (value?: ProgrammedReturnValue) => void;
  reverts: (reason?: string) => void;
};

export interface ProgrammableContractFunction extends WatchableContractFunction {
  returns: (value?: ProgrammedReturnValue) => void;
  returnsAtCall: (index: number, value?: ProgrammedReturnValue) => void;
  reverts: (reason?: string) => void;
  revertsAtCall: (index: number, reason?: string) => void;
  whenCalledWith: (...args: unknown[]) => WhenCalledWithChain;
  reset: () => void;
}

export type SmockContractBase<T extends BaseContract> = Omit<BaseContract, 'connect'> &
  Omit<T, 'connect'> & {
    wallet: Signer;
    fallback: ProgrammableContractFunction;
  };

export type FakeContract<T extends BaseContract = BaseContract> = SmockContractBase<T> & {
  connect: (...args: Parameters<T['connect']>) => FakeContract<T>;
} & {
    [Property in keyof T['functions']]: ProgrammableContractFunction;
  };

export type MockContract<T extends BaseContract = BaseContract> = SmockContractBase<T> & {
  connect: (...args: Parameters<T['connect']>) => MockContract<T>;
  setVariable: EditableStorageLogic['setVariable'];
} & {
    [Property in keyof T['functions']]: ProgrammableContractFunction;
  };

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;

export type MockContractFactory<F extends ContractFactory> = Omit<F, 'deploy'> & {
  deploy: (...args: Parameters<F['deploy']>) => Promise<MockContract<ThenArg<ReturnType<F['deploy']>>>>;
};
