import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import { MockContract, lopt } from '@lib';
import { Counter, Counter__factory } from '@typechained';

chai.should();
chai.use(lopt.matchers);

describe('Mock: Call through', () => {
  let counterFactory: Counter__factory;
  let mock: MockContract<Counter>;

  before(async () => {
    counterFactory = (await ethers.getContractFactory('Counter')) as Counter__factory;
  });

  beforeEach(async () => {
    mock = await lopt.mock(await counterFactory.deploy(1));
  });

  it('should call getters', async () => {
    expect(await mock.count()).to.equal(1);
  });

  it('should call methods', async () => {
    await mock.add(10);
    expect(await mock.count()).to.equal(11);
  });

  it('should be able to override returns', async () => {
    mock.count.returns(123);
    expect(await mock.count()).to.equal(123);
  });

  it('should be able to check function calls', async () => {
    await mock.add(10);
    expect(mock.add).to.be.calledOnceWith(10);
  });
});
