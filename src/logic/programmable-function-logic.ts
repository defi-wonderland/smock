import { ProgrammedReturnValue, ContractCall } from '../index';
import { EVMResult } from '@nomiclabs/ethereumjs-vm/dist/evm/evm';
import { WatchableFunctionLogic } from '../logic/watchable-function-logic';
import { map, Observable } from 'rxjs';
import { VmError } from '@nomiclabs/ethereumjs-vm/dist/exceptions';
import { fromHexString } from '../utils';
import BN from 'bn.js';
import { ethers } from 'ethers';

const EMPTY_ANSWER: Buffer = fromHexString('0x' + '00'.repeat(2048));

class ProgrammedAnswer {
  encodedValue: Buffer;
  shouldRevert: boolean;

  constructor(encodedValue: Buffer = EMPTY_ANSWER, shouldRevert: boolean = false) {
    this.encodedValue = encodedValue;
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
    let count = 0;
    results$.pipe(map((result) => ({ result, callIndex: count++ }))).subscribe(async ({ result, callIndex }) => {
      // Modify it with the corresponding answer
      await this.modifyAnswer(result, callIndex);
    });
  }

  returns(value?: ProgrammedReturnValue): void {
    this.defaultAnswer = new ProgrammedAnswer(this.encodeValue(value), false);
  }

  returnsAtCall(callIndex: number, value?: ProgrammedReturnValue): void {
    this.answerByIndex[callIndex] = new ProgrammedAnswer(this.encodeValue(value), false);
  }

  reverts(reason?: string): void {
    this.defaultAnswer = new ProgrammedAnswer(reason ? this.encodeRevertReason(reason) : EMPTY_ANSWER, true);
  }

  revertsAtCall(callIndex: number, reason?: string): void {
    this.answerByIndex[callIndex] = new ProgrammedAnswer(reason ? this.encodeRevertReason(reason) : EMPTY_ANSWER, true);
  }

  reset(): void {
    this.defaultAnswer = undefined;
    this.answerByIndex = {};
  }

  private async modifyAnswer(result: EVMResult, index: number): Promise<void> {
    const answer = this.answerByIndex[index] || this.defaultAnswer;

    if (answer) {
      result.gasUsed = new BN(0);
      result.execResult.returnValue = answer.encodedValue;
      result.execResult.gasUsed = new BN(0);
      result.execResult.exceptionError = answer.shouldRevert ? new VmError('lopt revert' as any) : undefined;
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
