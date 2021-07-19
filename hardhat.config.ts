import { HardhatUserConfig } from 'hardhat/config';

import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import '@typechain/hardhat/dist/type-extensions';
import 'tsconfig-paths/register';

const config: HardhatUserConfig = {
  paths: {
    sources: './test/contracts',
  },
  solidity: {
    version: '0.8.4',
    settings: {
      outputSelection: {
        '*': {
          '*': ['storageLayout'],
        },
      },
    },
  },
  typechain: {
    outDir: 'typechained',
    target: 'ethers-v5',
  },
};

export default config;
