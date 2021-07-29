import { EVMResult } from '@nomiclabs/ethereumjs-vm/dist/evm/evm';
import { VmError } from '@nomiclabs/ethereumjs-vm/dist/exceptions';
import BN from 'bn.js';
import { ethers } from 'ethers';
import { Observable } from 'rxjs';
import { ContractCall, ProgrammedReturnValue } from '../index';
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

  constructor(
    name: string,
    calls$: Observable<ContractCall>,
    results$: Observable<EVMResult>,
    encoder: (values?: ProgrammedReturnValue) => string
  ) {
    super(name, calls$);

    this.encoder = encoder;

    // Intercept every result of this programmableFunctionLogic
    results$.subscribe(async (result) => {
      // Modify it with the corresponding answer
      await this.modifyAnswer(result);
    });
  }

  returns(value?: ProgrammedReturnValue): void {
    this.defaultAnswer = new ProgrammedAnswer(value, false);
  }

  returnsAtCall(callIndex: number, value?: ProgrammedReturnValue): void {
    this.answerByIndex[callIndex] = new ProgrammedAnswer(value, false);
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
  }

  private async modifyAnswer(result: EVMResult): Promise<void> {
    const answer = this.answerByIndex[this.getCallCount() - 1] || this.defaultAnswer;

    if (answer) {
      result.gasUsed = new BN(0);
      result.execResult.gasUsed = new BN(0);
      if (answer.shouldRevert) {
        result.execResult.exceptionError = new VmError('lopt revert' as any);
        result.execResult.returnValue = this.encodeRevertReason(answer.value);
      } else {
        result.execResult.returnValue = this.encodeValue(answer.value);
      }
    }
  }

  private encodeValue(value?: ProgrammedReturnValue): Buffer {
    if (value === undefined) return EMPTY_ANSWER;

    let encodedReturnValue: string = '0x';
    try {
      encodedReturnValue = this.encoder(value);
    } catch (err) {
      if (err.code === 'INVALID_ARGUMENT') {
        if (typeof value !== 'string') {
          throw new Error(`Failed to encode return value for ${this.name}`);
        }

        encodedReturnValue = value;
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
