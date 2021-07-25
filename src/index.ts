import { BaseContract } from 'ethers';
import { matchers } from './chai-plugin/matchers';
import { Sandbox } from './sandbox';
import { FakeContract, FakeContractOptions, FakeContractSpec, MockContract } from './types';

let sandbox: Sandbox;

async function fake<Type extends BaseContract>(spec: FakeContractSpec, opts: FakeContractOptions = {}): Promise<FakeContract<Type>> {
  if (!sandbox) sandbox = await Sandbox.create();
  return await sandbox.fake(spec, opts);
}

async function mock<Contract extends BaseContract>(contract: Contract): Promise<MockContract<Contract>> {
  if (!sandbox) sandbox = await Sandbox.create();
  return await sandbox.mock(contract);
}

export * from './types';
export const lopt = { fake, mock, matchers };
