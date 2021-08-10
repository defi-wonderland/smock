Mocks
=====

What are mocks?
---------------

Mocks are extensions to smart contracts that have all of the functionality of a `fake <./fakes.html>`_ with some extra goodies.
Behind every mock is a real smart contract (with actual Solidity code!) of your choosing.
You can **modify the behavior of functions like a fake**, or you can leave the functions alone and calls will pass through to your actual contract code.
And, with a little bit of smock magic, you can even **modify the value of variables within your contract**! 🥳

When should I use a mock?
-------------------------

Generally speaking, mocks are more advanced versions of `fakes <./fakes.html>`_.
Mocks are most effectively used when you need *some* behavior of a real smart contract but still want the ability to modify things on the fly.

One powerful feature of a mock is that you can modify the value of variables within the smart contract.
You could, for example, use this feature to test the behavior of a function that changes behavior depending on the value of a variable.

Using mocks
-----------

Initialization
**************

Initialize with a contract name
###############################

.. code-block:: typescript

  const myContractFactory = await smock.mock("MyContract");
  const myContract = await myContractFactory.deploy(...);

Take full advantage of typescript and typechain
###############################################

.. code-block:: typescript

  await smock.mock<MyContract__factory>("MyContract");


Using features of fakes
***********************

Mocks can use any feature available to fakes.
See the documentation of `fakes <./fakes.html>`_ for more information.

Call through
************

Calls go through to contract by default
#######################################

.. code-block:: typescript

  await myMock.add(10);
  await myMock.count(); // returns 10

  myMock.count.returns(1);
  await myMock.count(); // returns 1

Manipulating variables
**********************

.. warning::
  This is an experimental feature and it is subject to API changes in the near future

Setting the value of a variable
###############################

.. code-block:: typescript

  await myMock.setVariable("myVariableName", 1234);

Setting the value of a struct
#############################

.. code-block:: typescript

  await myMock.setVariable("myStruct", {
    valueA: 1234,
    valueB: true,
  });
