Getting Started
===============

Installation
------------

To get started, install :code:`smock`:

.. tabs::

  .. group-tab:: yarn

    .. code-block:: text

      yarn add --dev @defi-wonderland/smock

  .. group-tab:: npm

    .. code-block:: text

      npm install --save-dev @defi-wonderland/smock

Enabling mocks
--------------

mocks require access to the internal storage layout of your smart contracts. The Solidity compiler exposes this via the storageLayout flag, which you need to enable at your hardhat config.

Here's an example :code:`hardhat.config.ts` that shows how to import the plugin:

.. code-block:: javascript

  import { HardhatUserConfig } from 'hardhat/config'

  const config: HardhatUserConfig = {
    ...
    solidity: {
      version: '0.8.4',
      settings: {
        outputSelection: {
          "*": {
              "*": ["storageLayout"],
          },
        },
      }
    },
    ...
  };

  export default config;
