import { Address } from '@nomicfoundation/ethereumjs-util';
import { ethers } from 'ethers';
import { Interface } from 'ethers/lib/utils';
import { findLast } from 'lodash';
import { Observable } from 'rxjs';
import { getMessageArgs } from '../factories/smock-contract';
import { ContractCall, ProgrammedReturnValue, WhenCalledWithChain } from '../index';
import { WatchableFunctionLogic } from '../logic/watchable-function-logic';
import { fromHexString, toHexString } from '../utils';

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
    private contractInterface: Interface,
    private sighash: string | null,
    name: string,
    calls$: Observable<ContractCall>,
    encoder: (values?: ProgrammedReturnValue) => string
  ) {
    super(name, calls$);

    this.encoder = encoder;
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

  async getEncodedCallAnswer(data: Buffer): Promise<[result: Buffer, shouldRevert: boolean] | undefined> {
    this.callCount++;

    const answer = this.getCallAnswer(data);
    if (answer) {
      if (answer.shouldRevert) {
        return [this.encodeRevertReason(answer.value), answer.shouldRevert];
      }

      return [await this.encodeValue(answer.value, data), answer.shouldRevert];
    }
  }

  private getCallAnswer(data: Buffer): ProgrammedAnswer | undefined {
    const args = this.sighash === null ? toHexString(data) : getMessageArgs(data, this.contractInterface, this.sighash);

    let answer: ProgrammedAnswer | undefined;

    // if there is an answer for this call index, return it
    answer = this.answerByIndex[this.getCallCount() - 1];
    if (answer) return answer;

    // if there is an answer for this call arguments, return it
    answer = findLast(this.answerByArgs, (option) => this.isDeepEqual(option.args, args))?.answer;
    if (answer) return answer;

    // return the default answer
    return this.defaultAnswer;
  }

  private async encodeValue(value: ProgrammedReturnValue, data: Buffer): Promise<Buffer> {
    if (value === undefined) return EMPTY_ANSWER;

    const args = this.sighash === null ? toHexString(data) : getMessageArgs(data, this.contractInterface, this.sighash);

    let toEncode = typeof value === 'function' ? await value(args) : value;

    let encodedReturnValue: string = '0x';
    try {
      encodedReturnValue = this.encoder(toEncode);
    } catch (err: any) {
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
