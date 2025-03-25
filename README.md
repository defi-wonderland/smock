[![image](https://img.shields.io/npm/v/@defi-wonderland/smock.svg?style=flat-square)](https://www.npmjs.org/package/@defi-wonderland/smock)

[![image](https://badgen.net/badge/icon/discord?icon=discord&label)](https://discord.com/invite/22RQcJjau9)

<div align="center">
    <a href="https://github.com/defi-wonderland/smock">
        <img src="https://user-images.githubusercontent.com/14298799/128897259-1d2c43b5-9156-425e-82e0-ab13f259e57c.gif" width="400px">
    </a>
</div>
<br />
<br />

## Soft-deprecation notice

Smock has had a fruitful life, and its legacy lives on
[smock-foundry](https://github.com/defi-wonderland/smock-foundry), a
re-implementation for foundry which we now use exclusively as a side-effect of
using `foundry` for all new projects.

This project will receive security/bug fixes and code review for the
foreseeable future, so existing projects can continue to use it, but no further
features will be implemented. In particular, we won't migrate the project to
newer versions of peer dependencies, as specified in
[#201](https://github.com/defi-wonderland/smock/issues/201)

**Smock** is the **S**olidity **mock**ing library. It's a plugin for
[hardhat](https://hardhat.org) that can be used to create mock Solidity
contracts entirely in JavaScript (or TypeScript!). With Smock, it's
easier than ever to test your smart contracts. You'll never have to
write another mock contract in Solidity again.

Smock is inspired by [sinon](https://sinonjs.org),
[sinon-chai](https://www.chaijs.com/plugins/sinon-chai), and Python's
[unittest.mock](https://docs.python.org/3/library/unittest.mock.html).
Although Smock is currently only compatible with
[hardhat](https://hardhat.org), we plan to extend support to other
testing frameworks like [Truffle](https://www.trufflesuite.com/).

If you wanna chat about the future of Solidity Mocking, join our
[Discord](https://discord.com/invite/22RQcJjau9)!

# Features

- Get rid of your folder of "mock" contracts and **just use
  JavaScript**.
- Keep your tests **simple** with a sweet set of chai matchers.
- Fully compatible with TypeScript and TypeChain.
- Manipulate the behavior of functions on the fly with **fakes**.
- Modify functions and internal variables of a real contract with
  **mocks**.
- Make **assertions** about calls, call arguments, and call counts.
- We've got extensive documentation and a complete test suite.

# Documentation

Detailed documentation can be found
[here](https://smock.readthedocs.io).

# Quick Start

## Installation

You can install Smock via npm or yarn:

``` console
npm install @defi-wonderland/smock
```

> **Note**: Starting from v2.4.0, Smock is only compatible with
> Hardhat v2.21.0 or later. If you are using an older version of Hardhat,
> please install Smock v2.3.5.

## Basic Usage

Smock is dead simple to use. Here's a basic example of how you might use
it to streamline your tests.

``` typescript
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
```

# License

Smock is released under the MIT license. Feel free to use, modify,
and/or redistribute this software as you see fit. See the
[LICENSE](https://github.com/defi-wonderland/smock/blob/main/LICENSE)
file for more information.

# Contributors

Maintained with love by [Optimism PBC](https://optimism.io) and [DeFi
Wonderland](https://defi.sucks). Made possible by viewers like you.
