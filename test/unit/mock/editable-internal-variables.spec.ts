import { lopt, MockContract, MockContractFactory } from '@src';
import { convertStructToPojo } from '@src/utils';
import { StorageGetter } from '@typechained';
import { expect } from 'chai';
import { BigNumber } from 'ethers';

describe('Mock: Editable internal variables', () => {
  let storageGetterFactory: MockContractFactory<StorageGetter>;
  let mock: MockContract<StorageGetter>;

  before(async () => {
    storageGetterFactory = await lopt.mock<StorageGetter>('StorageGetter');
  });

  beforeEach(async () => {
    mock = await storageGetterFactory.deploy(1);
  });

  it('should be able to set a uint256', async () => {
    await mock.storage.set('_uint256', 1234);
    expect(await mock.getUint256()).to.equal(1234);
  });

  it('should be able to set a boolean', async () => {
    await mock.storage.set('_bool', true);
    expect(await mock.getBool()).to.equal(true);
  });

  it('should be able to set an address', async () => {
    const address = '0x558ba9b8d78713fbf768c1f8a584485B4003f43F';
    await mock.storage.set('_address', address);

    expect(await mock.getAddress()).to.equal(address);
  });

  // TODO: Need to solve this with a rewrite.
  it.skip('should be able to set an address in a packed storage slot', async () => {
    const ret = '0x558ba9b8d78713fbf768c1f8a584485B4003f43F';
    await mock.storage.set('_packedB', ret);

    expect(await mock.getPackedAddress()).to.equal(ret);
  });

  it('should be able to set a simple struct', async () => {
    const struct = {
      valueA: BigNumber.from(1234),
      valueB: true,
    };
    await mock.storage.set('_simpleStruct', struct);

    expect(convertStructToPojo(await mock.getSimpleStruct())).to.deep.equal(struct);
  });

  it('should be able to set a uint256 mapping value', async () => {
    const mapKey = 1234;
    const mapValue = 5678;
    await mock.storage.set('_uint256Map', { [mapKey]: mapValue });

    expect(await mock.getUint256MapValue(mapKey)).to.equal(mapValue);
  });

  it('should be able to set a nested uint256 mapping value', async () => {
    const mapKeyA = 1234;
    const mapKeyB = 4321;
    const mapVal = 5678;

    await mock.storage.set('_uint256NestedMap', {
      [mapKeyA]: {
        [mapKeyB]: mapVal,
      },
    });

    expect(await mock.getNestedUint256MapValue(mapKeyA, mapKeyB)).to.equal(mapVal);
  });

  it('should let calls to the contract override the set variable', async () => {
    await mock.storage.set('_uint256', 1);
    await mock.setUint256(2);

    expect(await mock.getUint256()).to.equal(2);
  });

  it('should be able to set a value that was set in the constructor', async () => {
    await mock.storage.set('_constructorUint256', 1234);
    expect(await mock.getConstructorUint256()).to.equal(1234);
  });

  it('should be able to set values in a bytes5 => bool mapping', async () => {
    const mapKey = '0x0000005678';
    const mapValue = true;
    await mock.storage.set('_bytes5ToBoolMap', { [mapKey]: mapValue });

    expect(await mock.getBytes5ToBoolMapValue(mapKey)).to.equal(mapValue);
  });

  it('should be able to set values in a address => bool mapping', async () => {
    const mapKey = '0x558ba9b8d78713fbf768c1f8a584485B4003f43F';
    const mapValue = true;
    await mock.storage.set('_addressToBoolMap', { [mapKey]: mapValue });

    expect(await mock.getAddressToBoolMapValue(mapKey)).to.equal(mapValue);
  });

  it('should be able to set values in a address => address mapping', async () => {
    const mapKey = '0x558ba9b8d78713fbf768c1f8a584485B4003f43F';
    const mapValue = '0x063bE0Af9711a170BE4b07028b320C90705fec7C';
    await mock.storage.set('_addressToAddressMap', { [mapKey]: mapValue });

    expect(await mock.getAddressToAddressMapValue(mapKey)).to.equal(mapValue);
  });
});
