import { BaseContract, ContractFactory } from 'ethers';
import { matchers } from './chai-plugin/matchers';
import { Sandbox } from './sandbox';
import { FakeContract, FakeContractOptions, FakeContractSpec, MockContractFactory } from './types';

let sandbox: Sandbox;

async function fake<T extends BaseContract>(spec: FakeContractSpec, opts: FakeContractOptions = {}): Promise<FakeContract<T>> {
  if (!sandbox) sandbox = await Sandbox.create();
  return await sandbox.fake(spec, opts);
}


async function mock<T extends ContractFactory>(contractName: string): Promise<MockContractFactory<T>> {
  if (!sandbox) sandbox = await Sandbox.create();
  return await sandbox.mock(contractName);
}

export * from './types';
export const smock = { fake, mock, matchers };
