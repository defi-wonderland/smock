Fakes
=====

What are they
-------------

Fakes are empty contracts that emulate a given interface.

All of their functions can be watched and pre-programmed. When calling a function of a fake, by default, it will return the return type zero-state.


How to use
-----------------

Fakes can be initialized using the: **contract name**, **abi**, **factory** or even a **deployed contract**.

.. code-block:: javascript

  import { MyOracle, MyContract, MyContract__factory } from '@typechained';
  import { FakeContract, lopt } from '@defi-wonderland/lopt';

  chai.use(lopt.matchers);

  describe('MyContract', () => {
    let myContractFactory: MyContract__factory;

    let cookiesOracle: FakeContract<CookiesOracle>;
    let myContract: MyContract;

    before(async () => {
      myContractFactory = (await ethers.getContractFactory('MyContract')) as MyContract__factory;
    });

    beforeEach(async () => {
      cookiesOracle = await lopt.fake<CookiesOracle>('CookiesOracle');
      myContract = await myContractFactory.deploy(cookiesOracle.address);
    });

    it('should get data from the provided oracle', async () => {
      await myContract.cookiesLeftInTheWorld();
      expect(cookiesOracle.cookiesAmount).to.have.been.called;
    });
  });


Call count
----------

.. container:: code-explanation

  Passes if the function was called at least once, with any arguments:

  .. code-block:: javascript

    expect(fake.myFunction).to.have.been.called;


.. container:: code-explanation

  Passes if the function was called exactly once, with any arguments:

  .. code-block:: javascript

    expect(fake.myFunction).to.have.been.calledOnce;


.. container:: code-explanation

  Passes if the function was called exactly twice, with any arguments:

  .. code-block:: javascript

    expect(fake.myFunction).to.have.been.calledTwice;


.. container:: code-explanation

  Passes if the function was called exactly three times, with any arguments:

  .. code-block:: javascript

    expect(fake.myFunction).to.have.been.calledThrice;


.. container:: code-explanation

  Passes if the function was called exactly 123 times, with any arguments:

  .. code-block:: javascript

    expect(fake.myFunction).to.have.callCount(123);


Call arguments
--------------

.. container:: code-explanation

  Passes if the function was called at least once, with all of the provided arguments:

  .. code-block:: javascript

    expect(fake.myFunction).to.have.been.calledWith(123, true, 'abc');


.. container:: code-explanation

  It also work with structs, and nested structs 😉 :

  .. code-block:: javascript

    expect(fake.myFunction).to.have.been.calledWith({
      importantData: [1, 2, 3],
      someMore: {
        isThisWild: true
      }
    });


.. container:: code-explanation

  Passes if the function was a second time, with all of the provided arguments:

  .. code-block:: javascript

    expect(fake.myFunction.atCall(2)).to.have.been.calledWith(123, true);


.. container:: code-explanation

  Passes if the function was always called, with all of the provided arguments:

  .. code-block:: javascript

    expect(fake.myFunction).to.always.have.been.calledWith(123, true);


.. container:: code-explanation

  Passes if the function was called exactly once, and that time, it had all of the provided arguments:

  .. code-block:: javascript

    expect(fake.myFunction).to.have.been.calledOnceWith(123, true);


Call order
----------

.. container:: code-explanation

  Passes if the function was, at least once, called before/after the other function:

  .. code-block:: javascript

    expect(fake.myFunction).to.have.been.calledBefore(otherFake.otherFunction);

  .. code-block:: javascript

    expect(fake.myFunction).to.have.been.calledAfter(otherFake.otherFunction);


.. container:: code-explanation

  The same can also be tested using another function of the same contract

  .. code-block:: javascript

    expect(fake.myFunction).to.have.been.calledBefore(fake.otherFunction);


.. container:: code-explanation

  Passes if the function was, always, called before/after the other function:

  .. code-block:: javascript

    expect(fake.myFunction).to.always.have.been.calledBefore(otherFake.otherFunction);

  .. code-block:: javascript

    expect(fake.myFunction).to.always.have.been.calledAfter(otherFake.otherFunction);


.. container:: code-explanation

  Passes if the function was, at least once, called immediately before/after the other function (without any other call **to a fake or a mock** in the middle):

  .. code-block:: javascript

    expect(fake.myFunction).to.have.been.calledImmediatelyBefore(otherFake.otherFunction);

  .. code-block:: javascript
  
    expect(fake.myFunction).to.have.been.calledImmediatelyAfter(otherFake.otherFunction);


.. container:: code-explanation

  Passes if the function was, always, called immediately before/after the other function (without any other call **to a fake or a mock** in the middle):

  .. code-block:: javascript

    expect(fake.myFunction).to.always.have.been.calledImmediatelyBefore(otherFake.otherFunction);

  .. code-block:: javascript

    expect(fake.myFunction).to.always.have.been.calledImmediatelyAfter(otherFake.otherFunction);


Get call
----------

.. container:: code-explanation

  Return all the details of an specific call, **arguments** and **nonce** (call order)

  .. code-block:: javascript

    expect(fake.myFunction.getCall(0).args[0]).to.be.gt(50);


Returns
-------

.. container:: code-explanation

  Forces the function to return the provided value

  .. code-block:: javascript

    fake.getString.returns('a');


.. container:: code-explanation

  Forces the function, at the third call, to return the provided value

  .. code-block:: javascript

    fake.getString.returnsAtCall(3, 'b');


.. container:: code-explanation

  So with the combination of boths you can achieve something like this:

  .. code-block:: javascript

    fake.getString.returns('a');
    fake.getString.returnsAtCall(1, 'b');

    await fake.getString(); // will return 'a'
    await fake.getString(); // will return 'b'
    await fake.getString(); // will return 'a'



Reverts
-------

.. container:: code-explanation

  Forces the function to revert

  .. code-block:: javascript

    fake.getString.reverts();


.. container:: code-explanation

  Forces the function to revert with the provided message

  .. code-block:: javascript

    fake.getString.reverts('something crazy');


.. container:: code-explanation

  Forces the function, at the third call, to revert. You can provide a message as well.

  .. code-block:: javascript

    fake.getString.revertsAtCall(3);


.. container:: code-explanation

  So with the combination of boths you can achieve something like this:

  .. code-block:: javascript

    fake.getString.returns();
    fake.getString.revertsAtCall(1);

    await fake.callStatic.getString(); // won't revert
    await fake.callStatic.getString(); // will revert
    await fake.callStatic.getString(); // won't revert



Reset
-----

.. container:: code-explanation

  Returns the function to it's original functionality

  .. code-block:: javascript

    fake.getString.reset();


.. container:: code-explanation

  If affects pre-programmed return values:

  .. code-block:: javascript

      fake.getUint256.returns(123);
      await fake.callStatic.getUint256(); // returns 123

      fake.getUint256.reset();
      await fake.callStatic.getUint256(); // returns 0


.. container:: code-explanation

  And as well call counts:

  .. code-block:: javascript

      await fake.callStatic.getUint256();
      fake.getUint256.reset();
      await fake.callStatic.getUint256();
      
      expect(fake.getUint256).to.have.been.calledOnce; // true


Fallback functions
------------------


.. container:: code-explanation

  Fallback functions behave almost like any other function, the only difference is that their returned value will be hexified.

  .. code-block:: javascript

    fake.fallback.returns('0x1234');
    await ethers.provider.call({ to: fake.address }); // will return 0x1234
    
    fake.fallback.returns([1, 2, 3]);
    await ethers.provider.call({ to: fake.address }); // will return 0x010203
