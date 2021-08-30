import Message from '@nomiclabs/ethereumjs-vm/dist/evm/message';
import { BaseContract, ContractFactory, ethers } from 'ethers';
import { Interface } from 'ethers/lib/utils';
import { ethers as hardhatEthers } from 'hardhat';
import { Observable } from 'rxjs';
import { distinct, filter, map, share, withLatestFrom } from 'rxjs/operators';
import { EditableStorageLogic as EditableStorage } from '../logic/editable-storage-logic';
import { ProgrammableFunctionLogic, SafeProgrammableContract } from '../logic/programmable-function-logic';
import { ObservableVM } from '../observable-vm';
import { Sandbox } from '../sandbox';
import { ContractCall, FakeContract, MockContractFactory, ProgrammableContractFunction, ProgrammedReturnValue } from '../types';
import { fromFancyAddress, impersonate, toFancyAddress, toHexString } from '../utils';
import { getStorageLayout } from '../utils/storage';

export async function createFakeContract<Contract extends BaseContract>(
  vm: ObservableVM,
  address: string,
  contractInterface: ethers.utils.Interface,
  provider: ethers.providers.Provider
): Promise<FakeContract<Contract>> {
  const fake = (await initContract(vm, address, contractInterface, provider)) as unknown as FakeContract<Contract>;
  const contractFunctions = getContractFunctionsNameAndSighash(contractInterface, Object.keys(fake.functions));

  // attach to every contract function, all the programmable and watchable logic
  contractFunctions.forEach(([sighash, name]) => {
    const { encoder, calls$, results$ } = getFunctionEventData(vm, contractInterface, fake.address, sighash);
    const functionLogic = new SafeProgrammableContract(name, calls$, results$, encoder);
    fillProgrammableContractFunction(fake[name], functionLogic);
  });

  return fake;
}

export async function createMockContractFactory<T extends ContractFactory>(
  vm: ObservableVM,
  contractName: string
): Promise<MockContractFactory<T>> {
  const factory = (await hardhatEthers.getContractFactory(contractName)) as unknown as MockContractFactory<T>;

  const realDeploy = factory.deploy;
  factory.deploy = async (...args: Parameters<T['deploy']>) => {
    const mock = await realDeploy.apply(factory, args);
    const contractFunctions = getContractFunctionsNameAndSighash(mock.interface, Object.keys(mock.functions));

    // attach to every contract function, all the programmable and watchable logic
    contractFunctions.forEach(([sighash, name]) => {
      const { encoder, calls$, results$ } = getFunctionEventData(vm, mock.interface, mock.address, sighash);
      const functionLogic = new ProgrammableFunctionLogic(name, calls$, results$, encoder);
      fillProgrammableContractFunction(mock[name], functionLogic);
    });

    // attach to every internal variable, all the editable logic
    const editableStorage = new EditableStorage(await getStorageLayout(contractName), vm.getManager(), mock.address);
    mock.setVariable = editableStorage.setVariable.bind(editableStorage);

    return mock;
  };

  return factory;
}

async function initContract(
  vm: ObservableVM,
  address: string,
  contractInterface: ethers.utils.Interface,
  provider: ethers.providers.Provider
): Promise<BaseContract> {
  // Generate the contract object that we're going to attach our fancy functions to. Doing it this
  // way is nice because it "feels" more like a contract (as long as you're using ethers).
  const contract = new ethers.Contract(address, contractInterface, provider);

  // Set some code into the contract address so hardhat recognize it as a contract
  await vm.getManager().putContractCode(toFancyAddress(contract.address), Buffer.from('00', 'hex'));

  // We attach a wallet to the contract so that users can send transactions *from* a watchablecontract.
  (contract as any).wallet = await impersonate(contract.address);

  return contract;
}

function getFunctionEventData(vm: ObservableVM, contractInterface: ethers.utils.Interface, contractAddress: string, sighash: string | null) {
  const encoder = getFunctionEncoder(contractInterface, sighash);
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

function getFunctionEncoder(contractInterface: ethers.utils.Interface, sighash: string | null): (values?: ProgrammedReturnValue) => string {
  if (sighash === null) {
    // if it is a fallback function, return simplest encoder
    return (values) => values;
  } else {
    const fnFragment = contractInterface.getFunction(sighash);
    return (values) => {
      try {
        return contractInterface.encodeFunctionResult(fnFragment, [values]);
      } catch {
        return contractInterface.encodeFunctionResult(fnFragment, values);
      }
    };
  }
}

function parseAndFilterBeforeMessages(
  messages$: Observable<Message>,
  contractInterface: ethers.utils.Interface,
  contractAddress: string,
  sighash: string | null
) {
  // Get from the vm an observable from the messages that belong to this contract function
  return messages$.pipe(
    // Ensure the message has the same sighash than the function
    filter((message) => {
      if (sighash === null) {
        // sighash of callback
        return message.data.length === 0; // data is empty when it is from a callback function
      } else {
        return toHexString(message.data.slice(0, 4)) === sighash;
      }
    }),
    // Ensure the message is directed to this contract
    filter((message) => message.to.toString().toLowerCase() === contractAddress.toLowerCase()),
    map((message) => parseMessage(message, contractInterface, sighash)),
    share()
  );
}

function fillProgrammableContractFunction(fn: ProgrammableContractFunction, logic: ProgrammableFunctionLogic): void {
  fn._watchable = logic;
  fn.atCall = logic.atCall.bind(logic);
  fn.getCall = logic.getCall.bind(logic);
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
 * @returns array of sighash and function name
 */
function getContractFunctionsNameAndSighash(contractInterface: ethers.utils.Interface, names: string[]): [string | null, string][] {
  let functions: { [sighash: string]: string } = {};

  names.forEach((name) => {
    const sighash = contractInterface.getSighash(name);
    if (!functions[sighash] || !name.includes('(')) {
      functions[sighash] = name;
    }
  });

  return [...Object.entries(functions), [null, 'fallback']];
}

function parseMessage(message: Message, contractInterface: Interface, sighash: string | null): ContractCall {
  return {
    args: sighash === null ? toHexString(message.data) : getMessageArgs(message.data, contractInterface, sighash),
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
