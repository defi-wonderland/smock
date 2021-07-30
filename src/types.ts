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

export interface ProgrammableContractFunction extends WatchableContractFunction {
  returns: (value?: ProgrammedReturnValue) => void;
  returnsAtCall: (index: number, value?: ProgrammedReturnValue) => void;
  reverts: (reason?: string) => void;
  revertsAtCall: (index: number, reason?: string) => void;
  reset: () => void;
}

export type FakeContract<Type extends BaseContract> = BaseContract &
  Type &
  {
    [Property in keyof Type['functions']]: ProgrammableContractFunction;
  } & {
    wallet: Signer;
    fallback: ProgrammableContractFunction;
  };

export type MockContract<Contract extends BaseContract> = BaseContract &
  Contract &
  {
    [Property in keyof Contract['functions']]: ProgrammableContractFunction;
  } & {
    wallet: Signer;
    fallback: ProgrammableContractFunction;
    setVariable: EditableStorageLogic['setVariable'];
  };

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;

export type MockContractFactory<F extends ContractFactory> = Omit<F, 'deploy'> & {
  deploy: (...args: Parameters<F['deploy']>) => Promise<MockContract<ThenArg<ReturnType<F['deploy']>>>>
}
