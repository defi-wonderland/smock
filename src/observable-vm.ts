import VM from '@nomiclabs/ethereumjs-vm';
import { EVMResult } from '@nomiclabs/ethereumjs-vm/dist/evm/evm';
import Message from '@nomiclabs/ethereumjs-vm/dist/evm/message';
import { Transaction } from 'ethers';
import { Observable, Subject } from 'rxjs';
import { filter, share } from 'rxjs/operators';
import { LoptVMManager } from './types';

export class ObservableVM {
  private vm: VM;
  private beforeTx$: Observable<Transaction>;
  private beforeMessage$: Observable<Message>;
  private afterMessage$: Observable<EVMResult>;

  constructor(vm: VM) {
    if (!vm) throw new Error('VM is not defined');

    this.vm = vm;
    this.beforeTx$ = ObservableVM.fromEvent<Transaction>(vm, 'beforeTx');
    this.beforeMessage$ = ObservableVM.fromEvent<Message>(vm, 'beforeMessage');
    this.afterMessage$ = ObservableVM.fromEvent<EVMResult>(vm, 'afterMessage');
  }

  getManager(): LoptVMManager {
    return (this.vm.pStateManager || this.vm.stateManager) as LoptVMManager;
  }

  getBeforeTx(): Observable<Transaction> {
    return this.beforeTx$;
  }

  getBeforeMessages(): Observable<Message> {
    return this.beforeMessage$.pipe(filter((message) => !!message.to));
  }

  getAfterMessages(): Observable<EVMResult> {
    return this.afterMessage$;
  }

  private static fromEvent<T>(vm: VM, eventName: string): Observable<T> {
    const subject = new Subject<T>();
    vm.on(eventName, (event: T) => subject.next(event));
    return subject.asObservable().pipe(share());
  }
}
