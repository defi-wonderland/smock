import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { FakeContract, smock } from '@src';
import { BYTES32_EXAMPLE, BYTES_EXAMPLE, STRUCT_DYNAMIC_SIZE_EXAMPLE, STRUCT_FIXED_SIZE_EXAMPLE } from '@test-utils';
import { Caller, Caller__factory, Receiver } from '@typechained';
import chai from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

chai.should();
chai.use(smock.matchers);

describe('WatchableFunctionLogic: Type handling', () => {
  let fake: FakeContract<Receiver>;
  let caller: Caller;
  let signer: SignerWithAddress;

  before(async () => {
    [, signer] = await ethers.getSigners();

    const callerFactory = (await ethers.getContractFactory('Caller')) as Caller__factory;
    caller = await callerFactory.deploy();
  });

  beforeEach(async () => {
    fake = await smock.fake<Receiver>('Receiver');
  });

  it('should handle no arguments', async () => {
    await caller.call(fake.address, fake.interface.encodeFunctionData('receiveEmpty', []));
    fake.receiveEmpty.should.have.been.calledWith();
  });

  it('should handle boolean argument', async () => {
    await caller.call(fake.address, fake.interface.encodeFunctionData('receiveBoolean', [true]));
    fake.receiveBoolean.should.have.been.calledWith(true);
  });

  it('should handle uint256 argument', async () => {
    await caller.call(fake.address, fake.interface.encodeFunctionData('receiveUint256', [BigNumber.from(1)]));
    fake.receiveUint256.should.have.been.calledWith(BigNumber.from(1));
  });

  it('should handle uint32 argument', async () => {
    await caller.call(fake.address, fake.interface.encodeFunctionData('receiveUint32', [1]));
    fake.receiveUint32.should.have.been.calledWith(1);
  });

  it('should handle multiple uint arguments with different sizes', async () => {
    await caller.call(fake.address, fake.interface.encodeFunctionData('receiveMultipleUintMixed', [BigNumber.from(1), 2]));
    fake.receiveMultipleUintMixed.should.have.been.calledWith(BigNumber.from(1), 2);
  });

  it('should handle bytes32 argument', async () => {
    await caller.call(fake.address, fake.interface.encodeFunctionData('receiveBytes32', [BYTES32_EXAMPLE]));
    fake.receiveBytes32.should.have.been.calledWith(BYTES32_EXAMPLE);
  });

  it('should handle bytes argument', async () => {
    await caller.call(fake.address, fake.interface.encodeFunctionData('receiveBytes', [BYTES_EXAMPLE]));
    fake.receiveBytes.should.have.been.calledWith(BYTES_EXAMPLE);
  });

  it('should handle string argument', async () => {
    await caller.call(fake.address, fake.interface.encodeFunctionData('receiveString', ['hey']));
    fake.receiveString.should.have.been.calledWith('hey');
  });

  it('should handle multiple different arguments', async () => {
    await caller.call(
      fake.address,
      fake.interface.encodeFunctionData('receiveMultiple', [true, STRUCT_DYNAMIC_SIZE_EXAMPLE, BigNumber.from(1), 'hey'])
    );
    fake.receiveMultiple.should.have.been.calledWith(true, STRUCT_DYNAMIC_SIZE_EXAMPLE, BigNumber.from(1), 'hey');
  });

  it('should handle fixed size struct argument', async () => {
    await caller.call(fake.address, fake.interface.encodeFunctionData('receiveStructFixedSize', [STRUCT_FIXED_SIZE_EXAMPLE]));
    fake.receiveStructFixedSize.should.have.been.calledWith(STRUCT_FIXED_SIZE_EXAMPLE);
  });

  it('should handle dynamic size struct argument', async () => {
    await caller.call(fake.address, fake.interface.encodeFunctionData('receiveStructDynamicSize', [STRUCT_DYNAMIC_SIZE_EXAMPLE]));
    fake.receiveStructDynamicSize.should.have.been.calledWith(STRUCT_DYNAMIC_SIZE_EXAMPLE);
  });

  it('should handle mixed size struct argument', async () => {
    const arg = {
      ...STRUCT_FIXED_SIZE_EXAMPLE,
      ...STRUCT_DYNAMIC_SIZE_EXAMPLE,
    };
    await caller.call(fake.address, fake.interface.encodeFunctionData('receiveStructMixedSize', [arg]));
    fake.receiveStructMixedSize.should.have.been.calledWith(arg);
  });

  it('should handle nested struct argument', async () => {
    const arg = {
      externalValBoolean: true,
      valStructFixedSize: STRUCT_FIXED_SIZE_EXAMPLE,
      valStructDynamicSize: STRUCT_DYNAMIC_SIZE_EXAMPLE,
    };
    await caller.call(fake.address, fake.interface.encodeFunctionData('receiveStructNested', [arg]));
    fake.receiveStructNested.should.have.been.calledWith(arg);
  });

  it('should handle uint256 array argument', async () => {
    await caller.call(fake.address, fake.interface.encodeFunctionData('receiveUint256Array', [[BigNumber.from(1), BigNumber.from(2)]]));
    fake.receiveUint256Array.should.have.been.calledWith([BigNumber.from(1), BigNumber.from(2)]);
  });

  it('should handle multiple uint256 array arguments', async () => {
    await caller.call(
      fake.address,
      fake.interface.encodeFunctionData('receiveMultipleUint256Arrays', [
        [BigNumber.from(1), BigNumber.from(2)],
        [BigNumber.from(3), BigNumber.from(4)],
      ])
    );
    fake.receiveMultipleUint256Arrays.should.have.been.calledWith(
      [BigNumber.from(1), BigNumber.from(2)],
      [BigNumber.from(3), BigNumber.from(4)]
    );
  });

  it('should handle overload', async () => {
    await caller.call(fake.address, fake.interface.encodeFunctionData('receiveOverload(bool)', [true]));
    await caller.call(fake.address, fake.interface.encodeFunctionData('receiveOverload(bool,bool)', [true, false]));
    fake['receiveOverload(bool)'].should.have.been.calledWith(true);
    fake['receiveOverload(bool,bool)'].should.have.been.calledWith(true, false);
  });

  it('should handle msg.value', async () => {
    const value = BigNumber.from(123);
    await fake.connect(signer).receiveEmpty({ value });
    fake.receiveEmpty.getCall(0).value.should.equal(value);
  });

  it('should handle empty msg.value', async () => {
    await fake.connect(signer).receiveEmpty();
    fake.receiveEmpty.getCall(0).value.should.equal(BigNumber.from(0));
  });
});
