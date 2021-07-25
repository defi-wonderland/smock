import { ContractCall } from '../types';
import { convertStructToPojo, getObjectAndStruct, humanizeTimes } from '../utils';
import { BehaviorSubject, OperatorFunction, Observable, of } from 'rxjs';
import { map, scan } from 'rxjs/operators';
import isEqual from 'lodash.isequal';
import isEqualWith from 'lodash.isequalwith';
import { BigNumber } from 'ethers';

export class WatchableFunctionLogic {
  protected name: string;
  protected calls: ContractCall[] = [];
  protected callCount$ = new BehaviorSubject<number>(0);
  protected called$ = new BehaviorSubject<boolean>(false);
  protected calledOnce$ = new BehaviorSubject<boolean>(false);
  protected calledTwice$ = new BehaviorSubject<boolean>(false);
  protected calledThrice$ = new BehaviorSubject<boolean>(false);

  constructor(name: string, calls$: Observable<ContractCall>) {
    this.name = name;

    calls$.subscribe((call) => this.calls.push(call));
    calls$.pipe(this.count()).subscribe(this.callCount$);
    this.assertCallCount(calls$, (times) => times > 0).subscribe(this.called$);
    this.assertCallCount(calls$, (times) => times === 1).subscribe(this.calledOnce$);
    this.assertCallCount(calls$, (times) => times === 2).subscribe(this.calledTwice$);
    this.assertCallCount(calls$, (times) => times === 3).subscribe(this.calledThrice$);
  }

  atCall(index: number): WatchableFunctionLogic {
    if (!this.getCall(index))
      throw new Error(
        `expected ${this.name} to have been called ${humanizeTimes(index + 1)}, but it was called ${humanizeTimes(this.calls.length)}`
      );
    return new WatchableFunctionLogic(this.name, of(this.getCall(index)));
  }

  getCall(index: number): ContractCall {
    return this.calls[index];
  }

  calledWith(...expectedCallArgs: unknown[]): boolean {
    return !!this.calls.find((call) => isEqualWith(call.args, expectedCallArgs, this.isEqualCustomizer.bind(this)));
  }

  alwaysCalledWith(...expectedCallArgs: unknown[]): boolean {
    const callWithOtherArgs = this.calls.find((call) => !isEqualWith(call.args, expectedCallArgs, this.isEqualCustomizer.bind(this)));
    return this.getCalled() && !callWithOtherArgs;
  }

  calledOnceWith(...expectedCallArgs: unknown[]): boolean {
    return this.getCalledOnce() && this.calledWith(...expectedCallArgs);
  }

  calledBefore(anotherWatchableContract: WatchableFunctionLogic): boolean {
    return this.compareWatchableContractNonces(
      this,
      anotherWatchableContract,
      (thisNonce, anotherWatchableContractNonce) => thisNonce < anotherWatchableContractNonce
    );
  }

  alwaysCalledBefore(anotherWatchableContract: WatchableFunctionLogic): boolean {
    return this.calls[this.calls.length - 1]?.nonce < anotherWatchableContract.calls[0]?.nonce;
  }

  calledAfter(anotherWatchableContract: WatchableFunctionLogic): boolean {
    return this.compareWatchableContractNonces(
      this,
      anotherWatchableContract,
      (thisNonce, anotherWatchableContractNonce) => thisNonce > anotherWatchableContractNonce
    );
  }

  alwaysCalledAfter(anotherWatchableContract: WatchableFunctionLogic): boolean {
    return this.calls[0]?.nonce > anotherWatchableContract.calls[anotherWatchableContract.calls.length - 1]?.nonce;
  }

  calledImmediatelyBefore(anotherWatchableContract: WatchableFunctionLogic): boolean {
    return this.compareWatchableContractNonces(
      this,
      anotherWatchableContract,
      (thisNonce, anotherWatchableContractNonce) => thisNonce === anotherWatchableContractNonce - 1
    );
  }

  alwaysCalledImmediatelyBefore(anotherWatchableContract: WatchableFunctionLogic): boolean {
    if (this.calls.length === 0 || this.calls.length != anotherWatchableContract.calls.length) return false;
    return !this.calls.find((thisCall, index) => {
      return thisCall.nonce !== anotherWatchableContract.calls[index].nonce - 1;
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
    if (this.calls.length === 0 || this.calls.length != anotherWatchableContract.calls.length) return false;
    return !this.calls.find((thisCall, index) => {
      return thisCall.nonce !== anotherWatchableContract.calls[index].nonce + 1;
    });
  }

  getName(): string {
    return this.name;
  }

  getCallCount(): number {
    return this.callCount$.getValue();
  }

  getCalled(): boolean {
    return this.called$.getValue();
  }

  getCalledOnce(): boolean {
    return this.calledOnce$.getValue();
  }

  getCalledTwice(): boolean {
    return this.calledTwice$.getValue();
  }

  getCalledThrice(): boolean {
    return this.calledThrice$.getValue();
  }

  private count(): OperatorFunction<unknown, number> {
    return scan((acc) => acc + 1, 0);
  }

  private assertCallCount<T>(calls$: Observable<T>, assertion: (times: number) => boolean): Observable<boolean> {
    return calls$.pipe(
      this.count(),
      map((times) => assertion(times))
    );
  }

  private compareWatchableContractNonces(
    watchablecontractA: WatchableFunctionLogic,
    watchablecontractB: WatchableFunctionLogic,
    comparison: (nonceA: number, nonceB: number) => boolean
  ): boolean {
    return !!watchablecontractA.calls.find((watchablecontractACall) => {
      return watchablecontractB.calls.find((watchablecontractBCall) => {
        return comparison(watchablecontractACall.nonce, watchablecontractBCall.nonce);
      });
    });
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
