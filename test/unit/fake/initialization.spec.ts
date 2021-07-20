import chai, { expect } from 'chai';
import { FakeContract, lopt } from '@lib';
import { Receiver, Receiver__factory } from '@typechained';
import receiverArtifact from 'artifacts/test/contracts/watchable-function-logic/Receiver.sol/Receiver.json';
import { ethers } from 'hardhat';

chai.should();
chai.use(lopt.matchers);

describe('Fake: Initialization', () => {
  let fake: FakeContract<Receiver>;

  it('should work with the contract name', async () => {
    fake = await lopt.fake<Receiver>('Receiver');
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });

  it(`should work with the contract's artifact`, async () => {
    fake = await lopt.fake<Receiver>(receiverArtifact);
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });

  it(`should work with the contract's abi`, async () => {
    fake = await lopt.fake<Receiver>(receiverArtifact.abi);
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });

  it(`should work with the contract factory`, async () => {
    const factory = (await ethers.getContractFactory('Receiver')) as Receiver__factory;
    fake = await lopt.fake<Receiver>(factory);
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });

  it(`should work with the contract`, async () => {
    const factory = (await ethers.getContractFactory('Receiver')) as Receiver__factory;
    fake = await lopt.fake<Receiver>(await factory.deploy());
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });
});
