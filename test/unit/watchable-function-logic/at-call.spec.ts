import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import { FakeContract, lopt } from '@src';
import { Caller, Caller__factory, Receiver } from '@typechained';

chai.should();
chai.use(lopt.matchers);

describe('WatchableFunctionLogic: At call', () => {
  let fake: FakeContract<Receiver>;
  let caller: Caller;

  before(async () => {
    const callerFactory = (await ethers.getContractFactory('Caller')) as Caller__factory;
    caller = await callerFactory.deploy();
  });

  beforeEach(async () => {
    fake = await lopt.fake<Receiver>('Receiver');
  });

  it('should throw when the watchablecontract was never called', async () => {
    expect(() => {
      fake.receiveString.atCall(0).should.have.been.calledWith('b');
    }).to.throw('expected receiveString to have been called once, but it was called 0 times');
  });

  it('should throw when the watchablecontract was not called the specified times', async () => {
    await callReceiveString('a');

    expect(() => {
      fake.receiveString.atCall(1).should.have.been.calledWith('b');
    }).to.throw('expected receiveString to have been called twice, but it was called once');
  });

  it('should throw when the watchablecontract was called with the correct argument in another call', async () => {
    await callReceiveString('a');
    await callReceiveString('b');

    expect(() => {
      fake.receiveString.atCall(1).should.have.been.calledWith('a');
    }).to.throw(`expected receiveString to have been called with arguments 'a'`);
  });

  it('should not throw when the watchablecontract was called with the correct argument in the correct call', async () => {
    await callReceiveString('a');
    await callReceiveString('b');
    await callReceiveString('c');

    fake.receiveString.atCall(1).should.have.been.calledWith('b');
  });

  async function callReceiveString(str: string): Promise<void> {
    await caller.call(fake.address, fake.interface.encodeFunctionData('receiveString', [str]));
  }
});
