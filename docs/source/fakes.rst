Fakes
=====

What are fakes?
---------------

Fakes are JavaScript objects that emulate the interface of a given Solidity contract.
You can use fakes to customize the behavior of any public method or variable that a smart contract exposes.

When should I use a fake?
-------------------------

Fakes are a powerful tool when you want to test how a smart contract will interact with other contracts.
Instead of initalizing a full-fledged smart contract to interact with, you can simply create a fake that can provide pre-programmed responses.

Fakes are especially useful when the contracts that you need to interact with are relatively complex.
For example, imagine that you're testing a contract that needs to interact with another (very stateful) contract.
Without :code:`smock`, you'll probably have to:

1. Deploy the contract you need to interact with.
2. Perform a series of transactions to get the contract into the relevant state.
3. Run the test.
4. Do this all over again for each test.

This is annoying, slow, and brittle.
You might have to update a bunch of tests if the behavior of the other contract ever changes.
Developers usually end up using tricks like state snapshots and complex test fixtures to get around this problem.
Instead, you can use :code:`smock`:

1. Create a :code:`fake`.
2. Make your :code:`fake` return the value you want it to return.
3. Run the test.

Using fakes
-----------

Initialization
**************

Initialize with a contract name
###############################

.. code-block:: typescript

  const myFake = await smock.fake<MyContractType>("MyContract");


Initialize with a contract ABI
##############################

.. code-block:: typescript

  const myFake = await smock.fake<MyContractType>([ { ... } ]);

Initialize with a contract factory
##################################

.. code-block:: typescript

  const myContractFactory = await hre.ethers.getContractFactory("MyContract");
  const myFake = await smock.fake<MyContractType>(myContractFactory);

Initialize with a contract instance
###################################

.. code-block:: typescript

  const myContractFactory = await hre.ethers.getContractFactory("MyContract");
  const myContract = await myContractFactory.deploy();
  const myFake = await smock.fake<MyContractType>(myContract);

Making a function return
************************

Returning with the default value
################################

.. code-block:: typescript

  myFake.myFunction.returns();

Returning a fixed value
#######################

.. code-block:: typescript

  myFake.myFunction.returns(42);

Returning a struct
##################

.. code-block:: typescript

  myFake.getStruct.returns({
    valueA: 1234,
    valueB: false,
  });

Returning an array
##################

.. code-block:: typescript

  myFake.myFunctionArray.returns([1, 2, 3]);

Returning a dynamic value
#########################

.. code-block:: typescript

  myFake.myFunction.returns(() => {
    if (Math.random() < 0.5) {
      return 0;
    } else {
      return 1;
    }
  });

Returning a value based on arguments
####################################

.. code-block:: typescript

  myFake.getDynamicInput.returns(arg1 => arg1 * 10);
  
  await myFake.getDynamicInput(123); // returns 1230

Returning at a specific call count
##################################

.. code-block:: typescript

  myFake.myFunction.returnsAtCall(0, 5678);
  myFake.myFunction.returnsAtCall(1, 1234);

  await myFake.myFunction(); // returns 5678
  await myFake.myFunction(); // returns 1234

Making a function revert
************************

Reverting with no data
######################

.. code-block:: typescript

  myFake.myFunction.reverts();

Reverting with a string message
###############################

.. code-block:: typescript

  myFake.myFunction.reverts("Something went wrong");

Reverting with bytes data
#########################

.. code-block:: typescript

  myFake.myFunction.reverts("0x12341234");

Reverting at a specific call count
##################################

.. code-block:: typescript

  myFake.myFunction.returns(1234);
  myFake.myFunction.revertsAtCall(1, "Something went wrong");

  await myFake.myFunction(); // returns 1234
  await myFake.myFunction(); // reverts with "Something went wrong"
  await myFake.myFunction(); // returns 1234

Resetting function behavior
***************************

Resetting a function to original behavior
#########################################

.. code-block:: typescript

  myFake.myFunction().reverts();

  await myFake.myFunction(); // reverts

  myFake.reset();

  await myFake.myFunction(); // returns 0

Asserting call count
********************

Any number of calls
###################

.. code-block:: typescript

  expect(myFake.myFunction).to.have.been.called;

Called once
###########

.. code-block:: typescript

  expect(myFake.myFunction).to.have.been.calledOnce;

Called twice
############

.. code-block:: typescript

  expect(myFake.myFunction).to.have.been.calledTwice;

Called three times
##################

.. code-block:: typescript

  expect(myFake.myFunction).to.have.been.calledThrice;

Called N times
##############

.. code-block:: typescript

  expect(myFake.myFunction).to.have.callCount(123);

Asserting call arguments
************************

Called with specific arguments
##############################

.. code-block:: typescript

  expect(myFake.myFunction).to.have.been.calledWith(123, true, "abcd");

Called with struct arguments
############################

.. code-block:: typescript

  expect(myFake.myFunction).to.have.been.calledWith({
    myData: [1, 2, 3, 4],
    myNestedStruct: {
      otherValue: 5678
    }
  });

Called at a specific call index with arguments
##############################################

.. code-block:: typescript

  expect(myFake.myFunction.atCall(2)).to.have.been.calledWith(1234, false);

Called once with specific arguments
###################################

.. code-block:: typescript

  expect(myFake.myFunction).to.have.been.calledOnceWith(1234, false);

Asserting call order
********************

Called before other function
############################

.. code-block:: typescript

  expect(myFake.myFunction).to.have.been.calledBefore(myFake.myOtherFunction);

Called after other function
###########################

.. code-block:: typescript

  expect(myFake.myFunction).to.have.been.calledAfter(myFake.myOtherFunction);

Called immediately before other function
########################################

.. code-block:: typescript

  expect(myFake.myFunction).to.have.been.calledImmediatelyBefore(myFake.myOtherFunction);

Called immediately after other function
#######################################

.. code-block:: typescript

  expect(myFake.myFunction).to.have.been.calledImmediatelyAfter(myFake.myOtherFunction);


Querying call arguments
***********************

Getting arguments at a specific call index
##########################################

.. code-block:: typescript

  expect(myFake.myFunction.getCall(0).args[0]).to.be.gt(50);

Manipulating fallback functions
*******************************

Modifying the "fallback" function
#################################

.. code-block:: typescript

  myFake.fallback.returns();

Modifying the "receive" function
################################

.. code-block:: typescript

  myFake.receive.returns();
