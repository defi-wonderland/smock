import Message from '@nomiclabs/ethereumjs-vm/dist/evm/message';
import { toHexString, toFancyAddress, fromFancyAddress, impersonate } from '../utils';
import { BaseContract, ethers } from 'ethers';
import { Interface } from 'ethers/lib/utils';
import { distinct, filter, map, share, withLatestFrom } from 'rxjs/operators';
import { MockContract, ContractCall, FakeContract, ProgrammableContractFunction } from '../types';
import { ObservableVM } from '../observable-vm';
import { Observable } from 'rxjs';
import { SafeProgrammableContract, ProgrammableFunctionLogic } from '../logic/programmable-function-logic';
import { Sandbox } from '../sandbox';

export async function createFakeContract<Contract extends BaseContract>(
  vm: ObservableVM,
  address: string,
  contractInterface: ethers.utils.Interface,
  provider: ethers.providers.Provider
): Promise<FakeContract<Contract>> {
  const fake = await initContract<FakeContract<Contract>>(vm, address, contractInterface, provider);
  const uniqueFns = getUniqueFunctionNamesBySighash(contractInterface, Object.keys(fake.functions));

  Object.entries(uniqueFns).forEach(([sighash, name]) => {
    const { encoder, calls$, results$ } = getFunctionEventData(vm, contractInterface, fake.address, sighash);

    const functionLogic = new SafeProgrammableContract(name, calls$, results$, encoder);
    fillProgrammableContractFunction(fake[name], functionLogic);
  });

  return fake;
}

export async function createMockContract<Contract extends BaseContract>(vm: ObservableVM, contract: Contract): Promise<MockContract<Contract>> {
  const mock = contract as MockContract<Contract>;
  const uniqueFns = getUniqueFunctionNamesBySighash(mock.interface, Object.keys(mock.functions));

  Object.entries(uniqueFns).forEach(([sighash, name]) => {
    const { encoder, calls$, results$ } = getFunctionEventData(vm, mock.interface, mock.address, sighash);

    const functionLogic = new ProgrammableFunctionLogic(name, calls$, results$, encoder);
    fillProgrammableContractFunction(mock[name], functionLogic);
  });

  return mock;
}

async function initContract<T extends BaseContract>(
  vm: ObservableVM,
  address: string,
  contractInterface: ethers.utils.Interface,
  provider: ethers.providers.Provider
): Promise<T> {
  // Generate the contract object that we're going to attach our fancy functions to. Doing it this
  // way is nice because it "feels" more like a contract (as long as you're using ethers).
  const contract = new ethers.Contract(address, contractInterface, provider) as T;

  // Set some code into the contract address so hardhat recognize it as a contract
  await vm.getManager().putContractCode(toFancyAddress(contract.address), Buffer.from('00', 'hex'));

  // We attach a wallet to the contract so that users can send transactions *from* a watchablecontract.
  (contract as any).wallet = await impersonate(contract.address);

  return contract;
}

function getFunctionEventData(vm: ObservableVM, contractInterface: ethers.utils.Interface, contractAddress: string, sighash: string) {
  const fnFragment = contractInterface.getFunction(sighash);
  const encoder = (values?: ReadonlyArray<any>) => contractInterface.encodeFunctionResult(fnFragment, values);

  // Filter only the calls that correspond to this function, from vm beforeMessages
  const calls$ = parseAndFilterBeforeMessages(vm.getBeforeMessages(), contractInterface, contractAddress, sighash);
  // Get every result that comes right after a call to this function
  const results$ = vm.getAfterMessages().pipe(
    withLatestFrom(calls$),
    distinct(([, call]) => call),
    map(([answer]) => answer)
  );

  return { encoder, calls$, results$ };
}

function parseAndFilterBeforeMessages(
  messages$: Observable<Message>,
  contractInterface: ethers.utils.Interface,
  contractAddress: string,
  sighash: string
) {
  // Get from the vm an observable from the messages that belong to this contract function
  return messages$.pipe(
    // Ensure the message has the same sighash than the function
    filter((message) => toHexString(message.data.slice(0, 4)) === sighash),
    // Ensure the message is directed to this contract
    filter((message) => message.to.toString().toLowerCase() === contractAddress.toLowerCase()),
    map((message) => parseMessage(message, contractInterface, sighash)),
    share()
  );
}

function fillProgrammableContractFunction(fn: ProgrammableContractFunction, logic: ProgrammableFunctionLogic): void {
  fn._watchable = logic;
  fn.atCall = logic.atCall.bind(logic);
  fn.returns = logic.returns.bind(logic);
  fn.returnsAtCall = logic.returnsAtCall.bind(logic);
  fn.reverts = logic.reverts.bind(logic);
  fn.revertsAtCall = logic.revertsAtCall.bind(logic);
  fn.reset = logic.reset.bind(logic);
}

/**
 * When listing function names, hardhat provides all of them twice, for example:
 * - receiveBoolean
 * - receiveBoolean(bool)
 * This happens even though they are not overloaded.
 * This function leaves only one of the options, always priorizing the one without the args
 *
 * @param contractInterface contract interface in order to get the sighash of a name
 * @param names function names to be filtered
 * @returns unique function names and its sighashes
 */
function getUniqueFunctionNamesBySighash(contractInterface: ethers.utils.Interface, names: string[]): { [sighash: string]: string } {
  let result: { [sighash: string]: string } = {};
  names.forEach((name) => {
    const sighash = contractInterface.getSighash(name);
    if (!result[sighash] || !name.includes('(')) {
      result[sighash] = name;
    }
  });
  return result;
}

function parseMessage(message: Message, contractInterface: Interface, sighash: string): ContractCall {
  return {
    args: getMessageArgs(message.data, contractInterface, sighash),
    nonce: Sandbox.getNextNonce(),
    target: fromFancyAddress(message.delegatecall ? message._codeAddress : message.to),
  };
}

function getMessageArgs(messageData: Buffer, contractInterface: Interface, sighash: string): unknown[] {
  try {
    return contractInterface.decodeFunctionData(contractInterface.getFunction(sighash).format(), toHexString(messageData)) as unknown[];
  } catch (err) {
    throw new Error(`Failed to decode message data: ${err}`);
  }
}
