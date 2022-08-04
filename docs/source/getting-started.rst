Getting Started
===============

Installation
------------

.. tabs::

  .. group-tab:: yarn

    .. code-block:: text

      yarn add --dev @defi-wonderland/smock

  .. group-tab:: npm

    .. code-block:: text

      npm install --save-dev @defi-wonderland/smock

Required Config for Mocks
-------------------------

`Mocks <./mocks.html>`_ allow you to manipulate any variable inside of a smart contract.
If you'd like to use mocks, you **must** update your :code:`hardhat.config.<js/ts>` file to include the following:


.. tabs::

  .. group-tab:: JavaScript

    .. code-block:: javascript

      // hardhat.config.js

      ... // your plugin imports and whatnot go here

      module.exports = {
        ... // your other hardhat settings go here
        solidity: {
          ... // your other Solidity settings go here
          compilers: [
            ...// compiler options
            settings: {
              outputSelection: {
                "*": {
                  "*": ["storageLayout"]
                }
              }
            }
          ] 
        }
      }

  .. group-tab:: TypeScript

    .. code-block:: typescript

      // hardhat.config.js

      ... // your plugin imports and whatnot go here

      const config = {
        ... // your other hardhat settings go here
        solidity: {
          ... // your other Solidity settings go here
          compilers: [
            ...// compiler options
          ],
          settings: {
              outputSelection: {
                "*": {
                  "*": ["storageLayout"]
              }
            }
          },
        }
      }

      export default config
