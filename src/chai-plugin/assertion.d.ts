import { WatchableContractFunction } from '@lib';

declare global {
  export namespace Chai {
    interface Assertion {
      /**
       * addition to chain that will call always form of method
       * For example: `always.have.been.calledWith` will call `alwaysCalledWith` method
       */
      always: Assertion;
      /**
       * true when called at least once.
       */
      called: Assertion;
      /**
       * @param count The number of recorded calls.
       */
      callCount(count: number): Assertion;
      /**
       * true when called exactly once.
       */
      calledOnce: Assertion;
      /**
       * true when called exactly twice.
       */
      calledTwice: Assertion;
      /**
       * true when called exactly thrice.
       */
      calledThrice: Assertion;
      /**
       * Returns true when called before another function.
       */
      calledBefore(otherFn: WatchableContractFunction): Assertion;
      /**
       * Returns true when called after another function.
       */
      calledAfter(otherFn: WatchableContractFunction): Assertion;
      /**
       * Returns true when called before another function, and no other calls occurred
       * between those.
       */
      calledImmediatelyBefore(otherFn: WatchableContractFunction): Assertion;
      /**
       * Returns true when called after another function, and no other calls occurred
       * between those.
       */
      calledImmediatelyAfter(otherFn: WatchableContractFunction): Assertion;
      /**
       * Returns true if call received provided arguments.
       */
      calledWith(...args: any[]): Assertion;
      /**
       * Returns true when called at exactly once with the provided arguments.
       */
      calledOnceWith(...args: any[]): Assertion;
    }
  }
}

declare const sinonChai: Chai.ChaiPlugin;
declare namespace sinonChai {}
export = sinonChai;
