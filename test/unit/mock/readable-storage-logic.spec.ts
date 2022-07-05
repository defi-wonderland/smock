import { MockContract, MockContractFactory, smock } from '@src';
import { convertStructToPojo } from '@src/utils';
import { ADDRESS_EXAMPLE, BYTES32_EXAMPLE, BYTES_EXAMPLE } from '@test-utils';
import { StorageGetter, StorageGetter__factory } from '@typechained';
import { expect } from 'chai';
import { BigNumber, utils } from 'ethers';

describe('Mock: Readable storage logic', () => {
  let storageGetterFactory: MockContractFactory<StorageGetter__factory>;
  let mock: MockContract<StorageGetter>;

  before(async () => {
    storageGetterFactory = await smock.mock('StorageGetter');
  });

  beforeEach(async () => {
    mock = await storageGetterFactory.deploy(1);
  });

  describe('getVariable', () => {
    it('should be able to get a uint256', async () => {
      const value = utils.parseUnits('123');
      await mock.setVariable('_uint256', value);
      expect(await mock.getUint256()).to.equal(value);

      const getValue = await mock.getVariable('_uint256');
      const expectedValue = await mock.getUint256();
      expect(getValue).to.equal(expectedValue);
    });

    it('should be able to get a uint16 in a packed slot', async () => {
      const value = BigNumber.from('1');
      const value2 = BigNumber.from('2');
      await mock.setPackedUintA(value);
      await mock.setPackedUintB(value2);
      expect(await mock.getPackedUintA()).to.equal(value);
      expect(await mock.getPackedUintB()).to.equal(value2);

      const getValue = await mock.getVariable('_packedUintB');
      const expectedValue = await mock.getPackedUintB();
      expect(getValue).to.equal(expectedValue);
    });

    it('should be able to get a int56', async () => {
      const value = 1;
      await mock.setVariable('_int56', value);
      expect(await mock.getInt56()).to.equal(value);

      const getValue = await mock.getVariable('_int56');
      const expectedValue = await mock.getInt56();
      expect(getValue.toString()).to.equal(expectedValue.toString());
    });

    // it('should be able to get a int256', async () => {
    //   const value = utils.parseUnits('-1');
    //   await mock.setVariable('_int256', value);

    //   const getValue = await mock.getVariable('_int256');
    //   const expectedValue = await mock.getInt256();
    //   console.log("getValue: ", getValue);
    //   expect(getValue).to.equal(expectedValue.toString());
    // });

    it('should be able to get an address', async () => {
      await mock.setVariable('_address', ADDRESS_EXAMPLE);
      expect(await mock.getAddress()).to.equal(ADDRESS_EXAMPLE);

      const getValue = await mock.getVariable('_address');
      const expectedValue = await mock.getAddress();
      expect(getValue).to.equal(expectedValue);
    });

    it('should be able to get a boolean', async () => {
      await mock.setVariable('_bool', true);
      expect(await mock.getBool()).to.equal(true);

      const getValue = await mock.getVariable('_bool');
      const expectedValue = await mock.getBool();
      expect(getValue).to.equal(expectedValue);
    });

    it('should be able to get a small value < 31 bytes', async () => {
      const value = BYTES_EXAMPLE.slice(0, 10);
      await mock.setVariable('_bytes', value);
      expect(await mock.getBytes()).to.equal(value);

      const getValue = await mock.getVariable('_bytes');
      const expectedValue = await mock.getBytes();
      expect(getValue).to.equal(expectedValue);
    });

    it('should be able to get a large value > 31 bytes', async () => {
      await mock.setVariable('_bytes', BYTES_EXAMPLE);
      expect(await mock.getBytes()).to.equal(BYTES_EXAMPLE);

      const getValue = await mock.getVariable('_bytes');
      const expectedValue = await mock.getBytes();
      expect(getValue).to.equal(expectedValue);
    });

    it('should be able to get bytes32', async () => {
      await mock.setVariable('_bytes32', BYTES32_EXAMPLE);
      expect(await mock.getBytes32()).to.equal(BYTES32_EXAMPLE);

      const getValue = await mock.getVariable('_bytes32');
      const expectedValue = await mock.getBytes32();
      expect(getValue).to.equal(expectedValue);
    });

    it('should be able to set a simple struct', async () => {
      const struct = {
        valueA: BigNumber.from(1234),
        valueB: true,
      };
      await mock.setVariable('_simpleStruct', struct);

      expect(convertStructToPojo(await mock.getSimpleStruct())).to.deep.equal(struct);

      const getValue = await mock.getVariable('_simpleStruct');
      expect(getValue).to.deep.equal(struct);
    });

    it('should be able to get an address in a packed struct', async () => {
      const struct = {
        packedA: true,
        packedB: ADDRESS_EXAMPLE,
      };
      await mock.setVariable('_packedStruct', struct);

      expect(convertStructToPojo(await mock.getPackedStruct())).to.deep.equal(struct);

      const getValue = await mock.getVariable('_packedStruct');
      expect(getValue).to.deep.equal(struct);
    });

    it('should be able to get an address in a packed struct', async () => {
      const struct = {
        packedA: BigNumber.from(2),
        packedB: BigNumber.from(1),
        packedC: BigNumber.from(2),
        packedD: BigNumber.from(1),
        packedE: ADDRESS_EXAMPLE,
      };
      await mock.setVariable('_packedStruct2', struct);
      const getValue = await mock.getVariable('_packedStruct2');
      expect(getValue).to.deep.equal(struct);
    });

    it('should be able to get a uint256 mapping value', async () => {
      const mapKey = 1234;
      const mapValue = 5678;
      await mock.setVariable('_uint256Map', { [mapKey]: mapValue });

      expect(await mock.getUint256MapValue(mapKey)).to.equal(mapValue);
      const getValue = await mock.getVariable('_uint256Map', mapKey);
      expect(getValue).to.equal(await mock.getUint256MapValue(mapKey));
    });

    it('should be able to gry values in a bytes5 => bool mapping', async () => {
      const mapKey = '0x0000005678';
      const mapValue = true;
      await mock.setVariable('_bytes5ToBoolMap', { [mapKey]: mapValue });

      expect(await mock.getBytes5ToBoolMapValue(mapKey)).to.equal(mapValue);
      const getValue = await mock.getVariable('_bytes5ToBoolMap', mapKey);
      expect(getValue).to.equal(await mock.getBytes5ToBoolMapValue(mapKey));
    });

    it('should be able to get a uint256[] variable', async () => {
      await mock.setUint256Array([1, 2, 3]);
      const getValue = await mock.getVariable('_uint256Array');
      expect(getValue).to.deep.equal(await mock.getUint256Array());
    });
  });
});
