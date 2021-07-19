/* Imports: External */
import { Artifact } from 'hardhat/types';
import { BaseContract, Contract, ContractFactory, ethers } from 'ethers';
import { Signer } from '@ethersproject/abstract-signer';
import { Provider } from '@ethersproject/abstract-provider';
import { JsonFragment, Fragment } from '@ethersproject/abi';
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

export interface SignerContract {
  wallet: Signer;
}

export interface WatchableContractFunction {
  _watchable: WatchableFunctionLogic;
  atCall: (index: number) => WatchableFunctionLogic;
}

export interface ContractCall {
  args: unknown[];
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
  SignerContract &
  {
    [Property in keyof Type['functions']]: ProgrammableContractFunction;
  };

export type MockContract<Contract extends BaseContract> = BaseContract &
  Contract &
  SignerContract &
  {
    [Property in keyof Contract['functions']]: ProgrammableContractFunction;
  };
