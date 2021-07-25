'use strict';

// import { createMatcher as match } from '@sinonjs/samsam';
import { diffJson } from 'diff';
import { inspect } from 'util';
import { WatchableFunctionLogic } from '../logic/watchable-function-logic';
import { convertStructToPojo, humanizeTimes, isStruct } from '../utils';
import * as color from './color';

function sinonFormat(...args: any[]) {
  return (inspect as any)(...args);
}

function colorSinonMatchText(matcher: any, calledArg: any, calledArgMessage: any) {
  var calledArgumentMessage = calledArgMessage;
  if (!matcher.test(calledArg)) {
    matcher.message = color.red(matcher.message);
    if (calledArgumentMessage) {
      calledArgumentMessage = color.green(calledArgumentMessage);
    }
  }
  return `${calledArgumentMessage} ${matcher.message}`;
}

function colorDiffText(diff: any) {
  var objects = diff.map((part: any) => {
    var text = part.value;
    if (part.added) {
      text = color.green(text);
    } else if (part.removed) {
      text = color.red(text);
    }
    if (diff.length === 2) {
      text += ' '; // format simple diffs
    }
    return text;
  });
  return objects.join('');
}

function quoteStringValue(value: any) {
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  return value;
}

export const formatters: { [key: string]: (watchableContract: WatchableFunctionLogic, args: unknown[]) => string } = {
  c: (watchableContract) => {
    return humanizeTimes(watchableContract.getCallCount());
  },

  n: (watchableContract) => {
    return watchableContract.getName();
  },

  D: (watchableContract, args: unknown[]) => {
    var message = '';

    for (var i = 0, l = watchableContract.getCallCount(); i < l; ++i) {
      // describe multiple calls
      if (l > 1) {
        message += `\nCall ${i + 1}:`;
      }
      var calledArgs = watchableContract.getCall(i).args;
      var expectedArgs = args.slice();

      for (var j = 0; j < calledArgs.length || j < expectedArgs.length; ++j) {
        let parsedCalledArgs = calledArgs[j];
        let parsedExpectedArgs = expectedArgs[j];

        if (parsedCalledArgs) {
          if (isStruct(parsedCalledArgs)) {
            parsedCalledArgs = convertStructToPojo(parsedCalledArgs);
          }

          parsedCalledArgs = quoteStringValue(parsedCalledArgs);
        }

        if (parsedExpectedArgs) {
          parsedExpectedArgs = quoteStringValue(parsedExpectedArgs);
        }

        message += '\n';

        var calledArgMessage = j < calledArgs.length ? sinonFormat(parsedCalledArgs) : '';
        // TODO: what is this
        // if (match.isMatcher(parsedExpectedArgs)) {
        //   message += colorSinonMatchText(parsedExpectedArgs, parsedCalledArgs, calledArgMessage);
        // } else {
        var expectedArgMessage = j < expectedArgs.length ? sinonFormat(parsedExpectedArgs) : '';
        var diff = diffJson(calledArgMessage, expectedArgMessage);
        message += colorDiffText(diff);
        // }
      }
    }

    return message;
  },

  C: (watchableContract) => {
    let calls: any[] = [];

    for (var i = 0, l = watchableContract.getCallCount(); i < l; ++i) {
      // eslint-disable-next-line @sinonjs/no-prototype-methods/no-prototype-methods
      // TODO: var stringifiedCall = `    ${watchableContract.getCall(i).toString()}`;
      var stringifiedCall = `    `;
      if (/\n/.test(calls[i - 1])) {
        stringifiedCall = `\n${stringifiedCall}`;
      }
      calls.push(stringifiedCall);
    }

    return calls.length > 0 ? `\n${calls.join('\n')}` : '';
  },

  t: (watchableContract) => {
    let objects: string[] = [];

    for (var i = 0, l = watchableContract.getCallCount(); i < l; ++i) {
      // TODO: objects.push(sinonFormat(watchableContract.thisValues[i]));
    }

    return objects.join(', ');
  },

  '*': (watchableContract, args) => {
    return args.map((arg: any) => sinonFormat(arg)).join(', ');
  },
};
