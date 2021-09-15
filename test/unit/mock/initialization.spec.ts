import { BigNumber } from '@ethersproject/bignumber';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { MockContractFactory, smock } from '@src';
import { Counter__factory, Librarian__factory, TestLibrary__factory } from '@typechained';
import chai, { expect } from 'chai';
import { ethers } from 'hardhat';

chai.use(smock.matchers);

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

  it('should be able to use libraries', async () => {
    const testLibrary = await (await ethers.getContractFactory('TestLibrary')).deploy();
    const librarian = await (
      await smock.mock<Librarian__factory>('Librarian', {
        libraries: {
          TestLibrary: testLibrary.address,
        },
      })
    ).deploy();

    expect(await librarian.getLibValue()).to.equal(10);
  });

  // TODO: make it work
  it.skip('should be able to use mocked libraries', async () => {
    const testLibrary = await (await smock.mock<TestLibrary__factory>('TestLibrary')).deploy();
    const librarian = await (
      await smock.mock<Librarian__factory>('Librarian', {
        libraries: {
          TestLibrary: testLibrary.address,
        },
      })
    ).deploy();

    const mockValue = BigNumber.from(123);
    testLibrary.getSomeValue.returns(mockValue);

    expect(await librarian.getLibValue()).to.equal(mockValue);
  });
});
