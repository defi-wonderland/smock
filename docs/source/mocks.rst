Mocks
=====

What are they
-------------

Mocks are deployed contract wrappers that have all of the fake's functionality and even more.

Because they are actually deployed contract, they can have actual **logic inside** that can be called through.
And because they have an state, **internal variable values can be overwritten** 🥳


How to use
-----------------

.. container:: code-explanation

  Mocks can be initialized only from deployed contracts. If we would have this contract:

  .. code-block:: solidity

    contract Counter {
      uint256 public count;

      constructor(uint256 _startAt) {
        count = _startAt;
      }

      function add(uint256 _amount) external {
        count += _amount;
      }
    }

.. container:: code-explanation

  We could do something like this, combining real and faked logic:

  .. code-block:: javascript

    import { MyOracle, Counter, Counter__factory } from '@typechained';
    import { MockContract, lopt } from '@defi-wonderland/lopt';

    chai.use(lopt.matchers);

    describe('Counter', () => {
      let counterFactory: Counter__factory;
      let counter: MockContract<Counter>;

      before(async () => {
        counterFactory = (await ethers.getContractFactory('Counter')) as Counter__factory;
      });

      beforeEach(async () => {
        counter = await counterFactory.deploy();
      });

      it('...', async () => {
        await counter.add(10);
        expect(await counter.count()).to.equal(11);

        await counter.count.returns(1);
        expect(await counter.count()).to.equal(1);
      });
    });


Call through
------------

.. container:: code-explanation

  By default, mock functions will call the real contract logic.

  .. code-block:: javascript

    await mock.add(10);
    await mock.count(); // returns 11

    await mock.count.returns(1);
    await mock.count(); // returns 1



Internal variables override
---------------------------

.. container:: code-explanation

  **Not yet developed**, but it should look something like this (open to new ideas)

  .. code-block:: javascript

    await mock.shouldGetCrazy(); // returns false
    await mock._myInternalVariable.set(true);
    await mock.shouldGetCrazy(); // returns true