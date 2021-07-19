import hre from 'hardhat';
import { Contract, ContractFactory, ethers } from 'ethers';
import { Artifact } from 'hardhat/types';
import { FakeContractSpec } from 'src/types';

export async function ethersInterfaceFromSpec(spec: FakeContractSpec): Promise<ethers.utils.Interface> {
  if (spec instanceof Contract) {
    return spec.interface;
  } else if (spec instanceof ContractFactory) {
    return spec.interface;
  } else if (spec instanceof ethers.utils.Interface) {
    return spec;
  } else if (isInterface(spec)) {
    return spec as any;
  } else if (isContractFactory(spec)) {
    return (spec as any).interface;
  } else if (isContract(spec)) {
    return (spec as any).interface;
  } else if (isArtifact(spec)) {
    return new ethers.utils.Interface(spec.abi);
  } else if (typeof spec === 'string') {
    try {
      return new ethers.utils.Interface(spec);
    } catch (err) {
      return (await (hre as any).ethers.getContractFactory(spec)).interface;
    }
  } else {
    return new ethers.utils.Interface(spec);
  }
}

function isInterface(obj: any): boolean {
  return (
    obj &&
    obj.functions !== undefined &&
    obj.errors !== undefined &&
    obj.structs !== undefined &&
    obj.events !== undefined &&
    Array.isArray(obj.fragments)
  );
}

function isContract(obj: any): boolean {
  return obj && obj.functions !== undefined && obj.estimateGas !== undefined && obj.callStatic !== undefined;
}

function isContractFactory(obj: any): boolean {
  return obj && obj.interface !== undefined && obj.deploy !== undefined;
}

function isArtifact(obj: any): obj is Artifact {
  return (
    obj &&
    typeof obj._format === 'string' &&
    typeof obj.contractName === 'string' &&
    typeof obj.sourceName === 'string' &&
    Array.isArray(obj.abi) &&
    typeof obj.bytecode === 'string' &&
    typeof obj.deployedBytecode === 'string' &&
    obj.linkReferences &&
    obj.deployedLinkReferences
  );
}
