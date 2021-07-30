import { WatchableContractFunction } from '../index';
import { WatchableFunctionLogic } from '../logic/watchable-function-logic';
import { formatters } from './formatter';

const TIME_WORDS = [, 'once', 'twice', 'thrice'];

export const matchers: Chai.ChaiPlugin = (chai: Chai.ChaiStatic, utils: Chai.ChaiUtils) => {
  function timesInWords(count: number) {
    return TIME_WORDS[count] || (count || 0) + ' times';
  }

  function findWatchableContract(obj: any) {
    if (obj instanceof WatchableFunctionLogic) return obj;
    if (obj?._watchable instanceof WatchableFunctionLogic) return obj._watchable;

    throw new TypeError(utils.inspect(obj) + ' is not a watchablecontract or a call to a watchablecontract!');
  }

  function printf(watchablecontract: WatchableFunctionLogic, format: string = '', ...args: any[]) {
    return format.replace(/%(.)/g, function (match, specifyer) {
      if (typeof formatters[specifyer] === 'function') {
        return String(formatters[specifyer](watchablecontract, args));
      } else if (!isNaN(parseInt(specifyer, 10))) {
        return args[specifyer - 1];
      }

      return `%${specifyer}`;
    });
  }

  function argToString(arg: any): string {
    if (arg instanceof WatchableFunctionLogic) {
      return arg.getName();
    }

    return arg.toString();
  }

  function getMessages(watchablecontract: WatchableFunctionLogic, action: string, nonNegatedSuffix: string, always: boolean, args: any[] = []) {
    const verbPhrase = always ? 'always have ' : 'have ';
    nonNegatedSuffix = nonNegatedSuffix || '';

    function printfArray(array: string[]) {
      return printf(watchablecontract, ...array);
    }

    return {
      affirmative: function () {
        return printfArray(['expected %n to ' + verbPhrase + action + nonNegatedSuffix].concat(args.map(argToString)));
      },
      negative: function () {
        return printfArray(['expected %n to not ' + verbPhrase + action].concat(args.map(argToString)));
      },
    };
  }

  function smockProperty(name: string, action: string, nonNegatedSuffix: string) {
    addChaiProperty(name, (assertion) => {
      const watchablecontract: WatchableFunctionLogic = findWatchableContract(assertion._obj);

      const messages = getMessages(watchablecontract, action, nonNegatedSuffix, false);
      const value: boolean = (watchablecontract as any)[getPropertyNameGetter(name)]();
      assertion.assert(value, messages.affirmative, messages.negative);
    });
  }

  function getPropertyNameGetter(name: string): string {
    return 'get' + name.charAt(0).toUpperCase() + name.slice(1);
  }

  function smockPropertyAsBooleanMethod(name: string, action: string, nonNegatedSuffix: string) {
    addChaiMethod(name, (assertion: any, arg: any) => {
      const watchablecontract: WatchableFunctionLogic = findWatchableContract(assertion._obj);

      const messages = getMessages(watchablecontract, action, nonNegatedSuffix, false, [timesInWords(arg)]);
      const value: unknown = (watchablecontract as any)[getPropertyNameGetter(name)]();
      assertion.assert(value === arg, messages.affirmative, messages.negative);
    });
  }

  function createSmockMethodHandler(smockName: string, action: string, nonNegatedSuffix: string) {
    return (assertion: any, ...args: unknown[]) => {
      const watchablecontract: WatchableFunctionLogic = findWatchableContract(assertion._obj);

      let methodToCall = smockName;
      let shouldBeAlways = false;

      // support always flag
      if (utils.flag(assertion, 'always')) {
        const alwaysMethod = 'always' + smockName[0].toUpperCase() + smockName.substring(1);
        if (typeof (watchablecontract as any)[alwaysMethod] !== 'function') {
          throw Error(`always flag is not supported for method ${smockName}`);
        }

        methodToCall = alwaysMethod;
        shouldBeAlways = true;
      }

      const messages = getMessages(watchablecontract, action, nonNegatedSuffix, shouldBeAlways, args.slice());
      assertion.assert((watchablecontract as any)[methodToCall](...args), messages.affirmative, messages.negative);
    };
  }

  function smockMethod(name: string, action: string, nonNegatedSuffix: string = '') {
    const handler = createSmockMethodHandler(name, action, nonNegatedSuffix);
    addChaiMethod(name, handler);
  }

  function smockMethodWithWatchableContractArg(name: string, action: string, nonNegatedSuffix: string = '') {
    const handler = createSmockMethodHandler(name, action, nonNegatedSuffix);
    addChaiMethod(name, (assertion, arg: WatchableContractFunction) => handler(assertion, arg._watchable));
  }

  // helper chai method in order to avoid using this keyword in the code
  function addChaiMethod<T extends any[]>(name: string, callback: (assertion: any, ...arg: T) => void): void {
    utils.addMethod(chai.Assertion.prototype, name, function (...args: T) {
      callback(this, ...args);
    });
  }

  // helper chai method in order to avoid using this keyword in the code
  function addChaiProperty(name: string, callback: (assertion: any) => void): void {
    utils.addProperty(chai.Assertion.prototype, name, function () {
      callback(this);
    });
  }

  addChaiProperty('always', (assertion) => utils.flag(assertion, 'always', true));
  smockProperty('called', 'been called', ' at least once, but it was never called');
  smockPropertyAsBooleanMethod('callCount', 'been called exactly %1', ', but it was called %c%C');
  smockProperty('calledOnce', 'been called exactly once', ', but it was called %c%C');
  smockProperty('calledTwice', 'been called exactly twice', ', but it was called %c%C');
  smockProperty('calledThrice', 'been called exactly thrice', ', but it was called %c%C');
  smockMethodWithWatchableContractArg('calledBefore', 'been called before %1');
  smockMethodWithWatchableContractArg('calledAfter', 'been called after %1');
  smockMethodWithWatchableContractArg('calledImmediatelyBefore', 'been called immediately before %1');
  smockMethodWithWatchableContractArg('calledImmediatelyAfter', 'been called immediately after %1');
  smockMethod('calledWith', 'been called with arguments %*', '%D');
  smockMethod('calledOnceWith', 'been called exactly once with arguments %*', '%D');
};
