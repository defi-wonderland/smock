*************
V1 to V2
*************

`DeFi Wonderland <https://github.com/defi-wonderland>`_ and `Optimism <https://github.com/ethereum-optimism>`_ have decided to join forces with our shady-super-coder's magic to launch a new and improved version of the mocking library you |:heart:|

We know the breaking changes on the API will make you do some leg work, but we promise it is going to be totally worth it!

Also, special thanks to the Optimism team for recognizing our work and allowing us to host the new library on our Github organization (this marks our first public release |:rocket:|)

Smock V2 focuses mainly on:

* API improvements
* Call arguments expectations
* Custom chai matchers
* Type extensions with generics
* Fakes and Mocks division
* Documentation

==========================

Before upgrading
================

If using Typescript, we highly recommend using `Typechain <https://github.com/ethereum-ts/TypeChain>`_ in order to take full advantage of the type extensions we provide. If you decide not to, you can still follow along by using the type :code:`Contract` from :code:`ethers` or :code:`any`.

With Typechain:

.. code-block:: typescript
  
  import { FakeContract } from '@defi-wonderland/lopt';
  import { CookieEater } from '@typechained';

  let cookieEater: FakeContract<CookieEater>; // will extend all of the CookieEater method types

Without Typechain:

.. code-block:: typescript
  
  import { FakeContract } from '@defi-wonderland/lopt';
  import { Contract } from 'ethers';

  let cookieEater: FakeContract<Contract>; // will extend all of the CookieEater method types


==========================

Installation
============

Uninstall the old package

.. tabs::

  .. group-tab:: yarn

    .. code-block:: text

      yarn remove @eth-optimism/smock

  .. group-tab:: npm

    .. code-block:: text

      npm uninstall @eth-optimism/smock

Install the new one

.. tabs::

  .. group-tab:: yarn

    .. code-block:: text

      yarn add --dev @defi-wonderland/lopt

  .. group-tab:: npm

    .. code-block:: text

      npm install --save-dev @defi-wonderland/lopt


==========================

New concepts
============

Instead of having Mock and Smod objects, now we use Fakes and Mocks.

* | **Fakes** are empty contracts that emulate a given interface.
  | All of their functions can be watched and pre-programmed. When calling a function of a fake, by default, it will return the return type zero-state.

* | **Mocks** are deployed contract wrappers that have all of the fake’s functionality and even more.
  | Because they are actually deployed contract, they can have actual logic inside that can be called through. And because they have a storage, internal variable values can be overwritten 🥳


==========================

API changes
===========

Smockit initialization
----------------------

.. container:: code-explanation

  Before:

  .. code-block:: typescript

    import { ethers } from 'hardhat';
    import { smockit } from '@eth-optimism/smock';

    const myContractFactory = await ethers.getContractFactory('MyContract');
    const myContract = await myContractFactory.deploy(...);
    const myMockContract = await smockit(myContract);

.. container:: code-explanation

  After:

  .. code-block:: typescript

    import { lopt } from '@defi-wonderland/lopt';
    import { MyContract } from '@typechained';

    const myFakeContract = await lopt.fake<MyContract>('MyContract');


Returns
-------

.. container:: code-explanation

  Before:

  .. code-block:: typescript

    myMockContract.smocked.myFunction.will.return.with('Some return value!');

.. container:: code-explanation

  After:

  .. code-block:: typescript

    myFakeContract.myFunction.returns('Some return value!');


Asserting call count
--------------------

.. container:: code-explanation

  Before:

  .. code-block:: typescript

    expect(myMockContract.smocked.myFunction.calls.length).to.equal(1);

.. container:: code-explanation

  After:

  .. code-block:: typescript

    expect(myFakeContract.myFunction).to.be.calledOnce;


Asserting call data
-------------------

.. container:: code-explanation

  Before:

  .. code-block:: typescript

    expect(MyMockContract.smocked.myFunction.calls.length).to.equal(1);
    expect(MyMockContract.smocked.myFunction.calls[0]).to.deep.equal(['Something', 123]);

.. container:: code-explanation

  After:

  .. code-block:: typescript

    expect(myFakeContract.myFunction).to.be.calledOnceWith('Something', 123);


Reverting
---------

.. container:: code-explanation

  Before:

  .. code-block:: typescript

    myMockContract.smocked.myFunction.will.revert();
    myMockContract.smocked.myOtherFunction.will.revert.with('Some error');

.. container:: code-explanation

  After:

  .. code-block:: typescript

    myFakeContract.myFunction.reverts();
    myFakeContract.myOtherFunction.reverts('Some error');


Creating a modifiable contract
------------------------------

.. container:: code-explanation

  Before:

  .. code-block:: typescript

    import { ethers } from 'hardhat';
    import { smoddit } from '@eth-optimism/smock';

    const myModifiableContractFactory = await smoddit('MyContract');
    const myModifiableContract = await MyModifiableContractFactory.deploy(...);

.. container:: code-explanation

  After:

  .. code-block:: typescript

    import { MyContract } from '@typechained';
    import { MockContract, MockContractFactory, lopt } from '@defi-wonderland/lopt';

    const myMockContractFactory: MockContractFactory<MyContract> = await lopt.mock('MyContract');
    const myMockContract: MockContract<MyContract> = await myMockContractFactory.deploy(...);


Modifying a contract variable value
-----------------------------------

.. container:: code-explanation

  Before:

  .. code-block:: typescript

    await myModifiableContract.smodify.put({
      _myInternalVariable: 1234
    });

.. container:: code-explanation

  After:

  .. code-block:: typescript

    await myMockContract.setVariable('_myInternalVariable', 1234);


And more...
===========

Smock V2 contains plenty of new features, you can check them all out in the docs!
