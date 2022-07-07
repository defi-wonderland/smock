import { smock } from '@src';
import { makeRandomAddress } from '@src/utils';
import { Receiver, Receiver__factory, Returner } from '@typechained';
import receiverArtifact from 'artifacts/test/contracts/watchable-function-logic/Receiver.sol/Receiver.json';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { ethers, network } from 'hardhat';
import storageArtifact from 'test/unit/fake/testdata/Storage.json';

chai.use(chaiAsPromised);

describe('Fake: Initialization', () => {
  it('should work with the contract name', async () => {
    const fake = await smock.fake('Receiver');
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });

  it(`should work with the contract's artifact`, async () => {
    const fake = await smock.fake(receiverArtifact);
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });

  it(`should work with the contract's abi`, async () => {
    const fake = await smock.fake(receiverArtifact.abi);
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });

  it(`should work with the contract factory`, async () => {
    const factory = (await ethers.getContractFactory('Receiver')) as Receiver__factory;
    const fake = await smock.fake(factory);
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });

  it(`should work with the contract interface`, async () => {
    const factory = (await ethers.getContractFactory('Receiver')) as Receiver__factory;
    const fake = await smock.fake(factory.interface);
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });

  it(`should work with the contract`, async () => {
    const factory = (await ethers.getContractFactory('Receiver')) as Receiver__factory;
    const fake = await smock.fake(await factory.deploy());
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });

  it(`should work with the contract full path`, async () => {
    const factory = (await ethers.getContractFactory('test/contracts/watchable-function-logic/Receiver.sol:Receiver')) as Receiver__factory;
    const fake = await smock.fake(await factory.deploy());
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });

  it(`should work with any object thas has an abi inside`, async () => {
    const fake = await smock.fake({ abi: receiverArtifact.abi });
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
    const fake = await smock.fake('IPartialReceiver');
    expect(fake.receiveEmpty._watchable).not.to.be.undefined;
  });

  it('should have a wallet', async () => {
    const fake = await smock.fake('Receiver');
    expect(fake.wallet._isSigner).to.be.true;
  });

  it('should work for abi with gas parameter', async () => {
    const fake = await smock.fake(storageArtifact);
    expect(fake.store._watchable).not.to.be.undefined;
  });

  it('should throw error for invalid json string abi', async () => {
    await expect(smock.fake(`{invalid}`)).to.be.rejectedWith(
      Error,
      `unable to generate smock spec from abi string.\nUnexpected token i in JSON at position 1`
    );
  });

  it('should throw error for non existent contract', async () => {
    let regex: RegExp = /unable to generate smock spec from contract name*/;
    await expect(smock.fake('NonExistentContract')).to.be.rejectedWith(Error, regex);
  });

  it('should throw error if contract name is ambiguous', async () => {
    let regex: RegExp = /unable to generate smock spec from contract name*/;
    await expect(smock.fake('Storage')).to.be.rejectedWith(Error, regex);
  });
});
