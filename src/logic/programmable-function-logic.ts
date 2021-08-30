import { EVMResult } from '@nomiclabs/ethereumjs-vm/dist/evm/evm';
import { VmError } from '@nomiclabs/ethereumjs-vm/dist/exceptions';
import BN from 'bn.js';
import { ethers } from 'ethers';
import { findLast } from 'lodash';
import { Observable, withLatestFrom } from 'rxjs';
import { ContractCall, ProgrammedReturnValue, WhenCalledWithChain } from '../index';
import { WatchableFunctionLogic } from '../logic/watchable-function-logic';
import { fromHexString } from '../utils';

const EMPTY_ANSWER: Buffer = fromHexString('0x' + '00'.repeat(2048));

class ProgrammedAnswer {
  value?: any;
  shouldRevert: boolean;

  constructor(value?: any, shouldRevert: boolean = false) {
    this.value = value;
    this.shouldRevert = shouldRevert;
  }
}

export class ProgrammableFunctionLogic extends WatchableFunctionLogic {
  protected encoder: (value: any) => string;
  protected defaultAnswer: ProgrammedAnswer | undefined;
  protected answerByIndex: { [index: number]: ProgrammedAnswer } = {};
  protected answerByArgs: { answer: ProgrammedAnswer; args: unknown[] }[] = [];

  constructor(
    name: string,
    calls$: Observable<ContractCall>,
    results$: Observable<EVMResult>,
    encoder: (values?: ProgrammedReturnValue) => string
  ) {
    super(name, calls$);

    this.encoder = encoder;

    // Intercept every result of this programmableFunctionLogic
    results$.pipe(withLatestFrom(calls$)).subscribe(async ([result, call]) => {
      // Modify it with the corresponding answer
      await this.modifyAnswer(result, call);
    });
  }

  returns(value?: ProgrammedReturnValue): void {
    this.defaultAnswer = new ProgrammedAnswer(value, false);
  }

  returnsAtCall(callIndex: number, value?: ProgrammedReturnValue): void {
    this.answerByIndex[callIndex] = new ProgrammedAnswer(value, false);
  }

  whenCalledWith(...args: unknown[]): WhenCalledWithChain {
    return {
      returns: (value?: ProgrammedReturnValue) => {
        this.answerByArgs.push({
          args,
          answer: new ProgrammedAnswer(value, false),
        });
      },
      reverts: (reason?: string) => {
        this.answerByArgs.push({
          args,
          answer: new ProgrammedAnswer(reason, true),
        });
      },
    };
  }

  reverts(reason?: string): void {
    this.defaultAnswer = new ProgrammedAnswer(reason, true);
  }

  revertsAtCall(callIndex: number, reason?: string): void {
    this.answerByIndex[callIndex] = new ProgrammedAnswer(reason, true);
  }

  reset(): void {
    super.reset();
    this.defaultAnswer = undefined;
    this.answerByIndex = {};
    this.answerByArgs = [];
  }

  private async modifyAnswer(result: EVMResult, call: ContractCall): Promise<void> {
    const answer = this.getCallAnswer(call);

    if (answer) {
      result.gasUsed = new BN(0);
      result.execResult.gasUsed = new BN(0);
      if (answer.shouldRevert) {
        result.execResult.exceptionError = new VmError('smock revert' as any);
        result.execResult.returnValue = this.encodeRevertReason(answer.value);
      } else {
        result.execResult.returnValue = await this.encodeValue(answer.value, call);
      }
    }
  }

  private getCallAnswer(call: ContractCall): ProgrammedAnswer | undefined {
    let answer: ProgrammedAnswer | undefined;

    // if there is an answer for this call index, return it
    answer = this.answerByIndex[this.getCallCount() - 1];
    if (answer) return answer;

    // if there is an answer for this call arguments, return it
    answer = findLast(this.answerByArgs, (option) => this.isDeepEqual(option.args, call.args))?.answer;
    if (answer) return answer;

    // return the default answer
    return this.defaultAnswer;
  }

  private async encodeValue(value: ProgrammedReturnValue, call: ContractCall): Promise<Buffer> {
    if (value === undefined) return EMPTY_ANSWER;

    let toEncode = typeof value === 'function' ? await value(call.args) : value;

    let encodedReturnValue: string = '0x';
    try {
      encodedReturnValue = this.encoder(toEncode);
    } catch (err) {
      if (err.code === 'INVALID_ARGUMENT') {
        if (typeof toEncode !== 'string') {
          throw new Error(`Failed to encode return value for ${this.name}`);
        }

        encodedReturnValue = toEncode;
      } else {
        throw err;
      }
    }

    return fromHexString(encodedReturnValue);
  }

  private encodeRevertReason(reason: string): Buffer {
    if (reason === undefined) return EMPTY_ANSWER;

    const errorInterface = new ethers.utils.Interface([
      {
        inputs: [
          {
            name: '_reason',
            type: 'string',
          },
        ],
        name: 'Error',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ]);

    return fromHexString(errorInterface.encodeFunctionData('Error', [reason]));
  }
}

export class SafeProgrammableContract extends ProgrammableFunctionLogic {
  protected defaultAnswer = new ProgrammedAnswer();

  reset() {
    super.reset();
    this.defaultAnswer = new ProgrammedAnswer();
  }
}
