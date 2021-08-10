smock
=====

.. image:: https://img.shields.io/npm/v/@defi-wonderland/smock.svg?style=flat-square
    :target: https://www.npmjs.org/package/@defi-wonderland/smock

:code:`smock` is the **S**\ olidity **mock**\ ing library.
It's a plugin for `hardhat <https://hardhat.org>`_ that can be used to create mock Solidity contracts entirely in JavaScript (or TypeScript!).
With :code:`smock`, it's easier than ever to test your smart contracts.
You'll never have to write another mock contract in Solidity again.

:code:`smock` is inspired by `sinon <https://sinonjs.org>`_, `sinon-chai <https://www.chaijs.com/plugins/sinon-chai>`_, and Python's `unittest.mock <https://docs.python.org/3/library/unittest.mock.html>`_.
Although :code:`smock` is currently only compatible with `hardhat <https://hardhat.org>`_, we plan to extend support to other testing frameworks like `Truffle <https://www.trufflesuite.com/>`_.

Features
--------

* Get rid of your folder of "mock" contracts and **just use JavaScript**.
* Keep your tests **simple** with a sweet set of chai matchers.
* Fully compatible with TypeScript and TypeChain.
* Manipulate the behavior of functions on the fly with **fakes**.
* Modify functions and internal variables of a real contract with **mocks**.
* Make **assertions** about calls, call arguments, and call counts.
* We've got extensive documentation and a complete test suite.

Documentation
-------------

Detailed documentation can be found `here <https://smock.readthedocs.io>`_.

Quick Start
-----------

Installation
************

You can install :code:`smock` via npm or yarn:

.. code-block:: console

    $ npm install @defi-wonderland/smock

Basic Usage
***********

:code:`smock` is dead simple to use.
Here's a basic example of how you might use it to streamline your tests.

.. code-block:: typescript

    ...
    import { FakeContract, smock } from '@defi-wonderland/smock';

    chai.should(); // if you like should syntax
    chai.use(smock.matchers);

    describe('MyContract', () => {
        let myContractFake: FakeContract<MyContract>;

        beforeEach(async () => {
            ...
            myContractFake = await smock.fake('MyContract');
        });

        it('some test', () => {
            myContractFake.bark.returns('woof');
            ...
            myContractFake.bark.atCall(0).should.be.calledWith('Hello World');
        });
    });

License
-------

:code:`smock` is released under the MIT license.
Feel free to use, modify, and/or redistribute this software as you see fit.
See the `LICENSE <https://github.com/defi-wonderland/smock/blob/main/LICENSE>`_ file for more information.

Contributors
------------

Maintained with love by `Optimism PBC <https://optimism.io>`_ and `DeFi Wonderland <https://defi.sucks>`_.
Made possible by viewers like you.
