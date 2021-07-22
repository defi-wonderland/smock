import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import { FakeContract, lopt } from '@src';
import { Caller, Caller__factory, Receiver } from '@typechained';
import { BaseContract } from 'ethers';

chai.should();
chai.use(lopt.matchers);

describe('WatchableFunctionLogic: Call arguments', () => {
  let fakeA: FakeContract<Receiver>;
  let fakeB: FakeContract<Receiver>;
  let caller: Caller;

  before(async () => {
    const callerFactory = (await ethers.getContractFactory('Caller')) as Caller__factory;
    caller = await callerFactory.deploy();
  });

  beforeEach(async () => {
    fakeA = await lopt.fake<Receiver>('Receiver');
    fakeB = await lopt.fake<Receiver>('Receiver');
  });

  describe('calledBefore', async () => {
    const assertionErrorMessage = 'expected receiveBoolean to have been called before receiveString';

    it('should throw when no call was made', async () => {
      expect(() => {
        fakeA.receiveBoolean.should.have.been.calledBefore(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when the main watchablecontract is not called', async () => {
      await sendStringToWatchableContract(fakeB);
      expect(() => {
        fakeA.receiveBoolean.should.have.been.calledBefore(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when the other watchablecontract is not called', async () => {
      await sendBooleanToWatchableContract(fakeA);
      expect(() => {
        fakeA.receiveBoolean.should.have.been.calledBefore(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when called after', async () => {
      await sendStringToWatchableContract(fakeB);
      await sendBooleanToWatchableContract(fakeA);

      expect(() => {
        fakeA.receiveBoolean.should.have.been.calledBefore(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should not throw when called before', async () => {
      await sendBooleanToWatchableContract(fakeA);
      await sendStringToWatchableContract(fakeB);

      fakeA.receiveBoolean.should.have.been.calledBefore(fakeB.receiveString);
    });

    it('should not throw when called after and then before', async () => {
      await sendBooleanToWatchableContract(fakeA);
      await sendStringToWatchableContract(fakeB);
      await sendBooleanToWatchableContract(fakeA);

      fakeA.receiveBoolean.should.have.been.calledBefore(fakeB.receiveString);
    });

    it('should not throw when called before and then after', async () => {
      await sendStringToWatchableContract(fakeB);
      await sendBooleanToWatchableContract(fakeA);
      await sendStringToWatchableContract(fakeB);

      fakeA.receiveBoolean.should.have.been.calledBefore(fakeB.receiveString);
    });
  });

  describe('always.calledBefore', async () => {
    const assertionErrorMessage = 'expected receiveBoolean to always have been called before receiveString';

    it('should throw when no call was made', async () => {
      expect(() => {
        fakeA.receiveBoolean.should.always.have.been.calledBefore(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when the main watchablecontract is not called', async () => {
      await sendStringToWatchableContract(fakeB);
      expect(() => {
        fakeA.receiveBoolean.should.always.have.been.calledBefore(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when the other watchablecontract is not called', async () => {
      await sendBooleanToWatchableContract(fakeA);
      expect(() => {
        fakeA.receiveBoolean.should.always.have.been.calledBefore(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when called after', async () => {
      await sendStringToWatchableContract(fakeB);
      await sendBooleanToWatchableContract(fakeA);

      expect(() => {
        fakeA.receiveBoolean.should.always.have.been.calledBefore(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when called after and then before', async () => {
      await sendBooleanToWatchableContract(fakeA);
      await sendStringToWatchableContract(fakeB);
      await sendBooleanToWatchableContract(fakeA);

      expect(() => {
        fakeA.receiveBoolean.should.always.have.been.calledBefore(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when called before and then after', async () => {
      await sendStringToWatchableContract(fakeB);
      await sendBooleanToWatchableContract(fakeA);
      await sendStringToWatchableContract(fakeB);

      expect(() => {
        fakeA.receiveBoolean.should.always.have.been.calledBefore(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should not throw when called before once', async () => {
      await sendBooleanToWatchableContract(fakeA);
      await sendStringToWatchableContract(fakeB);

      fakeA.receiveBoolean.should.always.have.been.calledBefore(fakeB.receiveString);
    });
  });

  describe('calledAfter', async () => {
    const assertionErrorMessage = 'expected receiveBoolean to have been called after receiveString';

    it('should throw when no call was made', async () => {
      expect(() => {
        fakeA.receiveBoolean.should.have.been.calledAfter(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when the main watchablecontract is not called', async () => {
      await sendStringToWatchableContract(fakeB);
      expect(() => {
        fakeA.receiveBoolean.should.have.been.calledAfter(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when the other watchablecontract is not called', async () => {
      await sendBooleanToWatchableContract(fakeA);
      expect(() => {
        fakeA.receiveBoolean.should.have.been.calledAfter(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when called before', async () => {
      await sendBooleanToWatchableContract(fakeA);
      await sendStringToWatchableContract(fakeB);

      expect(() => {
        fakeA.receiveBoolean.should.have.been.calledAfter(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should not throw when called after', async () => {
      await sendStringToWatchableContract(fakeB);
      await sendBooleanToWatchableContract(fakeA);

      fakeA.receiveBoolean.should.have.been.calledAfter(fakeB.receiveString);
    });

    it('should not throw when called after and then before', async () => {
      await sendBooleanToWatchableContract(fakeA);
      await sendStringToWatchableContract(fakeB);
      await sendBooleanToWatchableContract(fakeA);

      fakeA.receiveBoolean.should.have.been.calledAfter(fakeB.receiveString);
    });

    it('should not throw when called after and then after', async () => {
      await sendStringToWatchableContract(fakeB);
      await sendBooleanToWatchableContract(fakeA);
      await sendStringToWatchableContract(fakeB);

      fakeA.receiveBoolean.should.have.been.calledAfter(fakeB.receiveString);
    });
  });

  describe('always.calledAfter', async () => {
    const assertionErrorMessage = 'expected receiveBoolean to always have been called after receiveString';

    it('should throw when no call was made', async () => {
      expect(() => {
        fakeA.receiveBoolean.should.always.have.been.calledAfter(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when the main watchablecontract is not called', async () => {
      await sendStringToWatchableContract(fakeB);
      expect(() => {
        fakeA.receiveBoolean.should.always.have.been.calledAfter(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when the other watchablecontract is not called', async () => {
      await sendBooleanToWatchableContract(fakeA);
      expect(() => {
        fakeA.receiveBoolean.should.always.have.been.calledAfter(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when called before', async () => {
      await sendBooleanToWatchableContract(fakeA);
      await sendStringToWatchableContract(fakeB);

      expect(() => {
        fakeA.receiveBoolean.should.always.have.been.calledAfter(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when called after and then before', async () => {
      await sendBooleanToWatchableContract(fakeA);
      await sendStringToWatchableContract(fakeB);
      await sendBooleanToWatchableContract(fakeA);

      expect(() => {
        fakeA.receiveBoolean.should.always.have.been.calledAfter(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when called before and then after', async () => {
      await sendStringToWatchableContract(fakeB);
      await sendBooleanToWatchableContract(fakeA);
      await sendStringToWatchableContract(fakeB);

      expect(() => {
        fakeA.receiveBoolean.should.always.have.been.calledAfter(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should not throw when called after once', async () => {
      await sendStringToWatchableContract(fakeB);
      await sendBooleanToWatchableContract(fakeA);

      fakeA.receiveBoolean.should.always.have.been.calledAfter(fakeB.receiveString);
    });
  });

  describe('calledImmediatelyBefore', async () => {
    const assertionErrorMessage = 'expected receiveBoolean to have been called immediately before receiveString';

    it('should throw when no call was made', async () => {
      expect(() => {
        fakeA.receiveBoolean.should.have.been.calledImmediatelyBefore(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when the main watchablecontract is not called', async () => {
      await sendStringToWatchableContract(fakeB);
      expect(() => {
        fakeA.receiveBoolean.should.have.been.calledImmediatelyBefore(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when the other watchablecontract is not called', async () => {
      await sendBooleanToWatchableContract(fakeA);
      expect(() => {
        fakeA.receiveBoolean.should.have.been.calledImmediatelyBefore(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when called after', async () => {
      await sendStringToWatchableContract(fakeB);
      await sendBooleanToWatchableContract(fakeA);

      expect(() => {
        fakeA.receiveBoolean.should.have.been.calledImmediatelyBefore(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when not called immeditately before', async () => {
      await sendBooleanToWatchableContract(fakeA);
      await sendEmptyToWatchableContract(fakeA);
      await sendStringToWatchableContract(fakeB);

      expect(() => {
        fakeA.receiveBoolean.should.have.been.calledImmediatelyBefore(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should not throw when called immeditately before', async () => {
      await sendBooleanToWatchableContract(fakeA);
      await sendStringToWatchableContract(fakeB);

      fakeA.receiveBoolean.should.have.been.calledImmediatelyBefore(fakeB.receiveString);
    });
  });

  describe('always.calledImmediatelyBefore', async () => {
    const assertionErrorMessage = 'expected receiveBoolean to always have been called immediately before receiveString';

    it('should throw when no call was made', async () => {
      expect(() => {
        fakeA.receiveBoolean.should.always.have.been.calledImmediatelyBefore(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when the main watchablecontract is not called', async () => {
      await sendStringToWatchableContract(fakeB);
      expect(() => {
        fakeA.receiveBoolean.should.always.have.been.calledImmediatelyBefore(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when the other watchablecontract is not called', async () => {
      await sendBooleanToWatchableContract(fakeA);
      expect(() => {
        fakeA.receiveBoolean.should.always.have.been.calledImmediatelyBefore(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when not always called immeditately before', async () => {
      await sendBooleanToWatchableContract(fakeA);
      await sendStringToWatchableContract(fakeB);
      await sendBooleanToWatchableContract(fakeA);
      await sendEmptyToWatchableContract(fakeA);
      await sendStringToWatchableContract(fakeB);

      expect(() => {
        fakeA.receiveBoolean.should.always.have.been.calledImmediatelyBefore(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should not throw when always called immeditately before', async () => {
      await sendBooleanToWatchableContract(fakeA);
      await sendStringToWatchableContract(fakeB);

      fakeA.receiveBoolean.should.always.have.been.calledImmediatelyBefore(fakeB.receiveString);
    });
  });

  describe('calledImmediatelyAfter', async () => {
    const assertionErrorMessage = 'expected receiveBoolean to have been called immediately after receiveString';

    it('should throw when no call was made', async () => {
      expect(() => {
        fakeA.receiveBoolean.should.have.been.calledImmediatelyAfter(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when the main watchablecontract is not called', async () => {
      await sendStringToWatchableContract(fakeB);
      expect(() => {
        fakeA.receiveBoolean.should.have.been.calledImmediatelyAfter(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when the other watchablecontract is not called', async () => {
      await sendBooleanToWatchableContract(fakeA);
      expect(() => {
        fakeA.receiveBoolean.should.have.been.calledImmediatelyAfter(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when called before', async () => {
      await sendBooleanToWatchableContract(fakeA);
      await sendStringToWatchableContract(fakeB);

      expect(() => {
        fakeA.receiveBoolean.should.have.been.calledImmediatelyAfter(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when not called immeditately after', async () => {
      await sendStringToWatchableContract(fakeB);
      await sendEmptyToWatchableContract(fakeA);
      await sendBooleanToWatchableContract(fakeA);

      expect(() => {
        fakeA.receiveBoolean.should.have.been.calledImmediatelyAfter(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should not throw when called immeditately after', async () => {
      await sendStringToWatchableContract(fakeB);
      await sendBooleanToWatchableContract(fakeA);

      fakeA.receiveBoolean.should.have.been.calledImmediatelyAfter(fakeB.receiveString);
    });
  });

  describe('always.calledImmediatelyAfter', async () => {
    const assertionErrorMessage = 'expected receiveBoolean to always have been called immediately after receiveString';

    it('should throw when no call was made', async () => {
      expect(() => {
        fakeA.receiveBoolean.should.always.have.been.calledImmediatelyAfter(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when the main watchablecontract is not called', async () => {
      await sendStringToWatchableContract(fakeB);
      expect(() => {
        fakeA.receiveBoolean.should.always.have.been.calledImmediatelyAfter(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when the other watchablecontract is not called', async () => {
      await sendBooleanToWatchableContract(fakeA);
      expect(() => {
        fakeA.receiveBoolean.should.always.have.been.calledImmediatelyAfter(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should throw when not always called immeditately after', async () => {
      await sendStringToWatchableContract(fakeB);
      await sendBooleanToWatchableContract(fakeA);
      await sendStringToWatchableContract(fakeB);
      await sendEmptyToWatchableContract(fakeA);
      await sendBooleanToWatchableContract(fakeA);

      expect(() => {
        fakeA.receiveBoolean.should.always.have.been.calledImmediatelyAfter(fakeB.receiveString);
      }).to.throw(assertionErrorMessage);
    });

    it('should not throw when always called immeditately after', async () => {
      await sendStringToWatchableContract(fakeB);
      await sendBooleanToWatchableContract(fakeA);

      fakeA.receiveBoolean.should.always.have.been.calledImmediatelyAfter(fakeB.receiveString);
    });
  });

  async function sendBooleanToWatchableContract<T extends BaseContract>(watchablecontract: FakeContract<T>): Promise<void> {
    await caller.call(watchablecontract.address, watchablecontract.interface.encodeFunctionData('receiveBoolean', [true]));
  }

  async function sendStringToWatchableContract<T extends BaseContract>(watchablecontract: FakeContract<T>): Promise<void> {
    await caller.call(watchablecontract.address, watchablecontract.interface.encodeFunctionData('receiveString', ['something']));
  }

  async function sendEmptyToWatchableContract<T extends BaseContract>(watchablecontract: FakeContract<T>): Promise<void> {
    await caller.call(watchablecontract.address, watchablecontract.interface.encodeFunctionData('receiveEmpty', []));
  }
});
