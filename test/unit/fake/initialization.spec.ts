import { FakeContract, smock } from '@src';
import { makeRandomAddress } from '@src/utils';
import { Receiver, Receiver__factory, Returner } from '@typechained';
import receiverArtifact from 'artifacts/test/contracts/watchable-function-logic/Receiver.sol/Receiver.json';
import chai, { expect } from 'chai';
import { ethers, network } from 'hardhat';

chai.use(smock.matchers);

describe('Fake: Initialization', () => {
  let fake: FakeContract<Receiver>;

  it('should work with the contract name', async () => {
    fake = await smock.fake<Receiver>('Receiver');
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });

  it(`should work with the contract's artifact`, async () => {
    fake = await smock.fake<Receiver>(receiverArtifact);
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });

  it(`should work with the contract's abi`, async () => {
    fake = await smock.fake<Receiver>(receiverArtifact.abi);
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });

  it(`should work with the contract factory`, async () => {
    const factory = (await ethers.getContractFactory('Receiver')) as Receiver__factory;
    fake = await smock.fake<Receiver>(factory);
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });

  it(`should work with the contract interface`, async () => {
    const factory = (await ethers.getContractFactory('Receiver')) as Receiver__factory;
    fake = await smock.fake<Receiver>(factory.interface);
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });

  it(`should work with the contract`, async () => {
    const factory = (await ethers.getContractFactory('Receiver')) as Receiver__factory;
    fake = await smock.fake<Receiver>(await factory.deploy());
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });

  it(`should work with the contract full path`, async () => {
    const factory = (await ethers.getContractFactory('test/contracts/watchable-function-logic/Receiver.sol:Receiver')) as Receiver__factory;
    fake = await smock.fake<Receiver>(await factory.deploy());
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });

  it(`should work with any object thas has an abi inside`, async () => {
    fake = await smock.fake<Receiver>({ abi: receiverArtifact.abi });
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });

  it(`should be initializable in a given address`, async () => {
    const targetAddress = makeRandomAddress();

    const fakeReturner = await smock.fake<Returner>('Returner', { address: targetAddress });
    fakeReturner.getBoolean.returns(true);

    const returner = (await ethers.getContractAt('Returner', targetAddress)) as Returner;
    expect(await returner.callStatic.getBoolean()).to.be.true;
  });

  it('should handle evm resets', async () => {
    const receiver1 = await smock.fake<Receiver>('Receiver');
    await receiver1.callStatic.receiveEmpty();

    await network.provider.request({
      method: 'hardhat_reset',
      params: [],
    });

    const receiver2 = await smock.fake<Returner>('Returner');
    await expect(receiver2.callStatic.getBoolean()).not.to.be.reverted;
  });

  it('should work for an interface', async () => {
    fake = await smock.fake('IPartialReceiver');
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });
});
