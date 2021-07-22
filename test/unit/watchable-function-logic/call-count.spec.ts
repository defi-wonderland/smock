import { ethers } from 'hardhat';
import chai, { AssertionError, expect } from 'chai';
import { FakeContract, lopt } from '@src';
import { Caller, Caller__factory, Receiver } from '@typechained';

chai.should();
chai.use(lopt.matchers);

describe('WatchableFunctionLogic: Call count', () => {
  let fake: FakeContract<Receiver>;
  let caller: Caller;

  before(async () => {
    const callerFactory = (await ethers.getContractFactory('Caller')) as Caller__factory;
    caller = await callerFactory.deploy();
  });

  beforeEach(async () => {
    fake = await lopt.fake<Receiver>('Receiver');
  });

  describe('called', () => {
    it('should throw when the watchablecontract is undefined', () => {
      expect(() => {
        expect(undefined).to.have.been.called;
      }).to.throw(TypeError);
    });

    it('should throw when the watchablecontract is not called', () => {
      expect(() => {
        fake.receiveEmpty.should.have.been.called;
      }).to.throw(AssertionError);
    });

    it('should not throw when the watchablecontract is called once', async () => {
      await makeCall();

      fake.receiveEmpty.should.have.been.called;
    });

    it('should not throw when the watchablecontract is called twice', async () => {
      await makeCall();
      await makeCall();

      fake.receiveEmpty.should.have.been.called;
    });
  });

  describe('not called', () => {
    it('should not throw when the watchablecontract is not called', async () => {
      fake.receiveEmpty.should.not.have.been.called;
    });

    it('should throw when the watchablecontract is called once', async () => {
      await makeCall();

      expect(() => {
        fake.receiveEmpty.should.not.have.been.called;
      }).to.throw(AssertionError);
    });
  });

  describe('callCount', () => {
    it('should throw when the watchablecontract is not called', async () => {
      expect(() => {
        fake.receiveEmpty.should.have.callCount(1);
      }).to.throw(AssertionError);
    });

    it('should not throw an assertion error when the number of calls equals provided call count', async () => {
      await makeCall();
      await makeCall();
      await makeCall();
      await makeCall();

      expect(() => {
        fake.receiveEmpty.should.have.callCount(4);
      }).to.not.throw(AssertionError);
    });

    it('should failever the number of calls are not equal to provided call async count', async () => {
      await makeCall();
      await makeCall();
      await makeCall();

      expect(() => {
        fake.receiveEmpty.should.have.callCount(4);
      }).to.throw(AssertionError);
    });
  });

  describe('calledOnce', () => {
    it('should throw when the watchablecontract is not called', async () => {
      expect(() => {
        fake.receiveEmpty.should.have.been.calledOnce;
      }).to.throw(AssertionError);
    });

    it('should not throw when the watchablecontract is called once', async () => {
      await makeCall();

      fake.receiveEmpty.should.have.been.calledOnce;
    });

    it('should throw when the watchablecontract is called twice', async () => {
      await makeCall();
      await makeCall();

      expect(() => {
        fake.receiveEmpty.should.have.been.calledOnce;
      }).to.throw(AssertionError);
    });
  });

  describe('calledTwice', () => {
    it('should throw when the watchablecontract is not called', async () => {
      expect(() => {
        fake.receiveEmpty.should.have.been.calledTwice;
      }).to.throw(AssertionError);
    });

    it('should throw when the watchablecontract is called once', async () => {
      await makeCall();

      expect(() => {
        fake.receiveEmpty.should.have.been.calledTwice;
      }).to.throw(AssertionError);
    });

    it('should not throw when the watchablecontract is called twice', async () => {
      await makeCall();
      await makeCall();

      fake.receiveEmpty.should.have.been.calledTwice;
    });

    it('should throw when the watchablecontract is called thrice', async () => {
      await makeCall();
      await makeCall();
      await makeCall();

      expect(() => {
        fake.receiveEmpty.should.have.been.calledTwice;
      }).to.throw(AssertionError);
    });
  });

  describe('calledThrice', () => {
    it('should throw when the watchablecontract is not called', async () => {
      expect(() => {
        fake.receiveEmpty.should.have.been.calledThrice;
      }).to.throw(AssertionError);
    });

    it('should throw when the watchablecontract is called once', async () => {
      await makeCall();

      expect(() => {
        fake.receiveEmpty.should.have.been.calledThrice;
      }).to.throw(AssertionError);
    });

    it('should throw when the watchablecontract is called twice', async () => {
      await makeCall();
      await makeCall();

      expect(() => {
        fake.receiveEmpty.should.have.been.calledThrice;
      }).to.throw(AssertionError);
    });

    it('should not throw when the watchablecontract is called thrice', async () => {
      await makeCall();
      await makeCall();
      await makeCall();

      fake.receiveEmpty.should.have.been.calledThrice;
    });

    it('should throw when the watchablecontract is called four times', async () => {
      await makeCall();
      await makeCall();
      await makeCall();
      await makeCall();

      expect(() => {
        fake.receiveEmpty.should.have.been.calledThrice;
      }).to.throw(AssertionError);
    });
  });

  async function makeCall() {
    await caller.call(fake.address, fake.interface.encodeFunctionData('receiveEmpty', []));
  }
});
