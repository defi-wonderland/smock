import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { MockContractFactory, smock } from '@src';
import { Counter__factory } from '@typechained';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Mock: Initialization', () => {
  let mockFactory: MockContractFactory<Counter__factory>;
  let deployer: SignerWithAddress;

  before(async () => {
    [, deployer] = await ethers.getSigners();
    mockFactory = await smock.mock('Counter');
  });

  it('should be able to deploy from specific signer', async () => {
    const mock = await mockFactory.connect(deployer).deploy(0);
    expect(await mock.callStatic.deployer()).to.equal(deployer.address);
  });
});
