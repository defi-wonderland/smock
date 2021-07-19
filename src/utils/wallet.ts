import { ethers, network } from 'hardhat';
import { JsonRpcSigner } from '@ethersproject/providers';

export const impersonate = async (address: string): Promise<JsonRpcSigner> => {
  await network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address],
  });
  return ethers.provider.getSigner(address);
};
