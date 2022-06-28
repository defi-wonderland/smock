import { ethers } from 'ethers';
import hre from 'hardhat';
import { FakeContractSpec } from '../types';

export async function ethersInterfaceFromSpec(spec: FakeContractSpec): Promise<ethers.utils.Interface> {
  if (typeof spec === 'string') {
    try {
      if (isMaybeJsonObject(spec)) {
        return await ethersInterfaceFromAbi(spec);
      } else {
        return await ethersInterfaceFromContractName(spec);
      }
    } catch (err) {
      throw err;
    }
  }

  let foundInterface: any = spec;
  if (foundInterface.abi) {
    foundInterface = foundInterface.abi;
  } else if (foundInterface.interface) {
    foundInterface = foundInterface.interface;
  }

  if (foundInterface instanceof ethers.utils.Interface) {
    return foundInterface;
  } else {
    return new ethers.utils.Interface(foundInterface);
  }
}

async function ethersInterfaceFromAbi(abi: string): Promise<ethers.utils.Interface> {
  try {
    return new ethers.utils.Interface(abi);
  } catch (err) {
    const error: Error = err as Error;
    throw new Error(`unable to generate smock spec from abi string.\n${error.message}`);
  }
}

async function ethersInterfaceFromContractName(contractNameOrFullyQualifiedName: string): Promise<ethers.utils.Interface> {
  let error: Error | null = null;
  try {
    return (await (hre as any).ethers.getContractFactory(contractNameOrFullyQualifiedName)).interface;
  } catch (err) {
    error = err as Error;
  }

  try {
    return (await (hre as any).ethers.getContractAt(contractNameOrFullyQualifiedName, ethers.constants.AddressZero)).interface;
  } catch (err) {
    error = err as Error;
  }

  throw new Error(`unable to generate smock spec from contract name.\n${error.message}`);
}

function isMaybeJsonObject(str: string): boolean {
  let strJson = str.trim();
  return strJson.charAt(0) == '{' && strJson.charAt(strJson.length - 1) == '}';
}
