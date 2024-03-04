import { BigNumber } from 'ethers';
import isEqual from 'lodash.isequal';
import isEqualWith from 'lodash.isequalwith';
import { Observable, of } from 'rxjs';
import { ContractCall } from '../types';
import { convertStructToPojo, getObjectAndStruct, humanizeTimes } from '../utils';

export class WatchableFunctionLogic {
  protected name: string;
  protected callHistory: ContractCall[] = [];
  protected callCount = 0;

  constructor(name: string, calls$: Observable<ContractCall>) {
    this.name = name;

    calls$.subscribe((call) => this.callHistory.push(call));
  }

  atCall(index: number): WatchableFunctionLogic {
    if (!this.getCall(index))
      throw new Error(
        `expected ${this.name} to have been called ${humanizeTimes(index + 1)}, but it was called ${humanizeTimes(this.getCallCount())}`
      );
    return new WatchableFunctionLogic(this.name, of(this.getCall(index)));
  }

  getCall(index: number): ContractCall {
    return this.callHistory[index];
  }

  calledWith(...expectedCallArgs: unknown[]): boolean {
    return !!this.callHistory.find((call) => this.isDeepEqual(call.args, expectedCallArgs));
  }

  calledWithValue(value: BigNumber): boolean {
    return !!this.callHistory.find((call) => call.value.eq(value));
  }

  alwaysCalledWith(...expectedCallArgs: unknown[]): boolean {
    const callWithOtherArgs = this.callHistory.find((call) => !this.isDeepEqual(call.args, expectedCallArgs));
    return this.getCalled() && !callWithOtherArgs;
  }

  calledOnceWith(...expectedCallArgs: unknown[]): boolean {
    return this.getCalledOnce() && this.calledWith(...expectedCallArgs);
  }

  delegatedFrom(delegatorAddress: string): boolean {
    return !!this.callHistory.find((call) => call.delegatedFrom?.toLowerCase() === delegatorAddress.toLowerCase());
  }

  calledBefore(anotherWatchableContract: WatchableFunctionLogic): boolean {
    return this.compareWatchableContractNonces(
      this,
      anotherWatchableContract,
      (thisNonce, anotherWatchableContractNonce) => thisNonce < anotherWatchableContractNonce
    );
  }

  alwaysCalledBefore(anotherWatchableContract: WatchableFunctionLogic): boolean {
    return this.callHistory[this.getCallCount() - 1]?.nonce < anotherWatchableContract.callHistory[0]?.nonce;
  }

  calledAfter(anotherWatchableContract: WatchableFunctionLogic): boolean {
    return this.compareWatchableContractNonces(
      this,
      anotherWatchableContract,
      (thisNonce, anotherWatchableContractNonce) => thisNonce > anotherWatchableContractNonce
    );
  }

  alwaysCalledAfter(anotherWatchableContract: WatchableFunctionLogic): boolean {
    return this.callHistory[0]?.nonce > anotherWatchableContract.callHistory[anotherWatchableContract.getCallCount() - 1]?.nonce;
  }

  calledImmediatelyBefore(anotherWatchableContract: WatchableFunctionLogic): boolean {
    return this.compareWatchableContractNonces(
      this,
      anotherWatchableContract,
      (thisNonce, anotherWatchableContractNonce) => thisNonce === anotherWatchableContractNonce - 1
    );
  }

  alwaysCalledImmediatelyBefore(anotherWatchableContract: WatchableFunctionLogic): boolean {
    if (this.getCallCount() === 0 || this.getCallCount() != anotherWatchableContract.getCallCount()) return false;
    return !this.callHistory.find((thisCall, index) => {
      return thisCall.nonce !== anotherWatchableContract.callHistory[index].nonce - 1;
    });
  }

  calledImmediatelyAfter(anotherWatchableContract: WatchableFunctionLogic): boolean {
    return this.compareWatchableContractNonces(
      this,
      anotherWatchableContract,
      (thisNonce, anotherWatchableContractNonce) => thisNonce === anotherWatchableContractNonce + 1
    );
  }

  alwaysCalledImmediatelyAfter(anotherWatchableContract: WatchableFunctionLogic): boolean {
    if (this.getCallCount() === 0 || this.getCallCount() != anotherWatchableContract.getCallCount()) return false;
    return !this.callHistory.find((thisCall, index) => {
      return thisCall.nonce !== anotherWatchableContract.callHistory[index].nonce + 1;
    });
  }

  getName(): string {
    return this.name;
  }

  getCallCount(): number {
    return this.callCount;
  }

  getCalled(): boolean {
    return this.getCallCount() > 0;
  }

  getCalledOnce(): boolean {
    return this.getCallCount() === 1;
  }

  getCalledTwice(): boolean {
    return this.getCallCount() === 2;
  }

  getCalledThrice(): boolean {
    return this.getCallCount() === 3;
  }

  protected reset() {
    this.callCount = 0;
    this.callHistory = [];
  }

  private compareWatchableContractNonces(
    watchablecontractA: WatchableFunctionLogic,
    watchablecontractB: WatchableFunctionLogic,
    comparison: (nonceA: number, nonceB: number) => boolean
  ): boolean {
    return !!watchablecontractA.callHistory.find((watchablecontractACall) => {
      return watchablecontractB.callHistory.find((watchablecontractBCall) => {
        return comparison(watchablecontractACall.nonce, watchablecontractBCall.nonce);
      });
    });
  }

  protected isDeepEqual(obj1: unknown, obj2: unknown): boolean {
    return isEqualWith(obj1, obj2, this.isEqualCustomizer.bind(this));
  }

  /**
   * Normal deep comparison wont be enought when comparing expect vs result objects
   * - In case we are comparing 2 big numbers, we must compare them using the BigNumber methods
   * - In case we are asserting a struct, solidity converts them to struct arrays (explained in the isStruct method)
   *   so we must convert back the struct to an object and then compare it
   *
   * @param obj1 One of the objects
   * @param obj2 The other object :)
   * @returns Whether or not the objects are deep equal
   */
  private isEqualCustomizer(obj1: unknown, obj2: unknown): boolean | undefined {
    // handle big number comparisons
    if (BigNumber.isBigNumber(obj1)) {
      return obj1.eq(obj2 as any);
    }
    if (BigNumber.isBigNumber(obj2)) {
      return obj2.eq(obj1 as any);
    }

    // handle struct comparisons
    const objectAndStruct = getObjectAndStruct(obj1, obj2);
    if (objectAndStruct) {
      return isEqual(objectAndStruct[0], convertStructToPojo(objectAndStruct[1]));
    }

    // use default lodash comparison
    return undefined;
  }
}
