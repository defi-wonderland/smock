# smock

[![NPM Package](https://img.shields.io/npm/v/@defi-wonderland/smock.svg?style=flat-square)](https://www.npmjs.org/package/@defi-wonderland/smock)

---

`smock` is the **S**olidity **mock**ing library.
It's a [hardhat](https://hardhat.org) plugin that can generate `fakes` and `mocks` of Solidity contracts entirely in JavaScript (no more one-off mock contracts!).
You'll never have an easier time testing your smart contracts.

`smock` is inspired by [sinon](https://sinonjs.org/), [sinon-chai](https://www.chaijs.com/plugins/sinon-chai/), and Python's [unittest.mock](https://docs.python.org/3/library/unittest.mock.html).
Although `smock` is currently only compatible with [hardhat](https://hardhat.org), we plan to extend support to other frameworks (like Truffle).

`smock` is a collaboration between [Optimism](https://optimism.io) and [DeFi Wonderland](https://defi.sucks/).

## Why should I use smock?

`smock` makes the process of testing complex smart contracts significantly easier.
You'll never have to write another mock contract in Solidity again.

Here are some of the many benefits of using `smock`:

- No more one-off mock contracts written in Solidity. Everything happens in JavaScript.
- Simple and clear API.
- Supports chai's `expect` and `should` syntax.
- Use `fakes` to mock and assert contract calls without needing to deploy a real contract.
- Use `mocks` to manipulate the behavior of a real contract instance, with all the benefits of `fakes` and more.
- It's fully tested.
- It sounds cool.

## Documentation

Detailed documentation can be found [here](https://smock.readthedocs.io/en/latest/).

## Installation

You can easily install `smock` via `npm`:

```
npm install --save-dev @defi-wonderland/smock
```

Or via `yarn`:

```
yarn add --dev @defi-wonderland/smock
```

## Basic Usage

`smock` is easy to use.
Here's a simple example of how you might use it within your tests.
Refer to the [documentation](https://smock.readthedocs.io/en/latest/) for a complete overview of what `smock` has to offer.

```typescript
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

## License

`smock` is licensed under the [MIT License](./LICENSE).
