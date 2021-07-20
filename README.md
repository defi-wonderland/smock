# lopt

[![NPM Package](https://img.shields.io/npm/v/@defi-wonderland/lopt.svg?style=flat-square)](https://www.npmjs.org/package/@defi-wonderland/lopt)

`lopt` is a utility package that can generate mock Solidity contracts in the form of `fakes` and `mocks`.

`lopt` is based in [@eth-optimism/smock](https://github.com/ethereum-optimism/optimism/tree/develop/packages/smock), [sinon](https://sinonjs.org/) and [sinon-chai](https://www.chaijs.com/plugins/sinon-chai/).

Some benefits of using `lopt`:

- Test syntax is easy to understand, just like `sinon-chai`
- Supports both chai `expect` and `should` syntax
- Fully typed objects, that will **extend** your contract functions when using `typechain` (highly recommended)
- Mock and assert contract calls, without the need of even deploying it by using `fakes`
- If you need your contract logic, just wrap it in a `mock` and start asserting calls or changing behaviour
- Fully tested library

---

## Documentation

Documentation is available [here](https://lopt.readthedocs.io/en/latest/).

---

## Installation

You can easily install `lopt` via npm:

```
npm install --save-dev @defi-wonderland/lopt
```

Or via yarn:

```
yarn add --dev @defi-wonderland/lopt
```

---

## How to use

```typescript
...
import { FakeContract, lopt } from '@defi-wonderland/lopt';

chai.should(); // if you like should syntax
chai.use(lopt.matchers);

describe('MyContract', () => {
    let myContractFake: FakeContract<MyContract>;

    beforeEach(async () => {
        ...
        myContractFake = await lopt.fake<MyContract>('MyContract');
    });

    it('some test', () => {
        ...
        myContractFake.bark.atCall(0).should.be.calledWith('Hello World');
    });
});
```

---

## Why the name `lopt`?

Loki's alternative name is Lopt, and Loki was obviously taken.

Loki is the God of Mischief, a trickster, and the purpose of mocking libraries is basically to trick the tests.
