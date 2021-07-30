import { MockContract, MockContractFactory, smock } from '@src';
import { convertStructToPojo } from '@src/utils';
import { ADDRESS_EXAMPLE } from '@test-utils';
import { StorageGetter, StorageGetter__factory } from '@typechained';
import { expect } from 'chai';
import { BigNumber, utils } from 'ethers';

describe('Mock: Editable storage logic', () => {
  let storageGetterFactory: MockContractFactory<StorageGetter__factory>;
  let mock: MockContract<StorageGetter>;

  before(async () => {
    storageGetterFactory = await smock.mock('StorageGetter');
  });

  beforeEach(async () => {
    mock = await storageGetterFactory.deploy(1);
  });

  it('should be able to set a uint256', async () => {
    const value = utils.parseUnits('123');
    await mock.setVariable('_uint256', value);
    expect(await mock.getUint256()).to.equal(value);
  });

  it('should be able to set a boolean', async () => {
    await mock.setVariable('_bool', true);
    expect(await mock.getBool()).to.equal(true);
  });

  it('should be able to set an address', async () => {
    await mock.setVariable('_address', ADDRESS_EXAMPLE);

    expect(await mock.getAddress()).to.equal(ADDRESS_EXAMPLE);
  });

  it.skip('should be able to set an address in a packed storage slot', async () => {
    await mock.setVariable('_packedB', ADDRESS_EXAMPLE);

    expect(await mock.getPackedAddress()).to.equal(ADDRESS_EXAMPLE);
  });

  it.skip('should be able to set an address in a packed struct', async () => {
    const struct = {
      packedA: true,
      packedB: ADDRESS_EXAMPLE,
    };
    await mock.setVariable('_packedStruct', struct);

    expect(convertStructToPojo(await mock.getPackedAddress())).to.equal(struct);
  });

  it('should be able to set a simple struct', async () => {
    const struct = {
      valueA: BigNumber.from(1234),
      valueB: true,
    };
    await mock.setVariable('_simpleStruct', struct);

    expect(convertStructToPojo(await mock.getSimpleStruct())).to.deep.equal(struct);
  });

  it('should be able to set a uint256 mapping value', async () => {
    const mapKey = 1234;
    const mapValue = 5678;
    await mock.setVariable('_uint256Map', { [mapKey]: mapValue });

    expect(await mock.getUint256MapValue(mapKey)).to.equal(mapValue);
  });

  it('should be able to set a nested uint256 mapping value', async () => {
    const mapKeyA = 1234;
    const mapKeyB = 4321;
    const mapVal = 5678;

    await mock.setVariable('_uint256NestedMap', {
      [mapKeyA]: {
        [mapKeyB]: mapVal,
      },
    });

    expect(await mock.getNestedUint256MapValue(mapKeyA, mapKeyB)).to.equal(mapVal);
  });

  it('should let calls to the contract override the set variable', async () => {
    await mock.setVariable('_uint256', 1);
    await mock.setUint256(2);

    expect(await mock.getUint256()).to.equal(2);
  });

  it('should be able to set a value that was set in the constructor', async () => {
    await mock.setVariable('_constructorUint256', 1234);
    expect(await mock.getConstructorUint256()).to.equal(1234);
  });

  it('should be able to set values in a bytes5 => bool mapping', async () => {
    const mapKey = '0x0000005678';
    const mapValue = true;
    await mock.setVariable('_bytes5ToBoolMap', { [mapKey]: mapValue });

    expect(await mock.getBytes5ToBoolMapValue(mapKey)).to.equal(mapValue);
  });

  it('should be able to set values in a address => bool mapping', async () => {
    const mapKey = ADDRESS_EXAMPLE;
    const mapValue = true;
    await mock.setVariable('_addressToBoolMap', { [mapKey]: mapValue });

    expect(await mock.getAddressToBoolMapValue(mapKey)).to.equal(mapValue);
  });

  it('should be able to set values in a address => address mapping', async () => {
    const mapKey = ADDRESS_EXAMPLE;
    const mapValue = '0x063bE0Af9711a170BE4b07028b320C90705fec7C';
    await mock.setVariable('_addressToAddressMap', { [mapKey]: mapValue });

    expect(await mock.getAddressToAddressMapValue(mapKey)).to.equal(mapValue);
  });
});
