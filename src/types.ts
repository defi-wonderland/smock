/* Imports: External */
import { Fragment, JsonFragment } from '@ethersproject/abi';
import { Provider } from '@ethersproject/abstract-provider';
import { Signer } from '@ethersproject/abstract-signer';
import { BaseContract, Contract, ContractFactory, ethers } from 'ethers';
import { Artifact } from 'hardhat/types';
import { WatchableFunctionLogic } from './logic/watchable-function-logic';

export type FakeContractSpec = Artifact | Contract | ContractFactory | ethers.utils.Interface | string | (JsonFragment | Fragment | string)[];

export interface FakeContractOptions {
  provider?: Provider;
  address?: string;
}

export type ProgrammedReturnValue = any;

export interface LoptVMManager {
  putContractCode: (address: Buffer, code: Buffer) => Promise<void>;
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
  };
