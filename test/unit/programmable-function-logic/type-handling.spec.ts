import chai, { expect } from 'chai';
import { lopt, FakeContract } from '@src';
import { Returner } from '@typechained';
import { BigNumber, utils } from 'ethers';
import { toPlainObject } from 'lodash';
import { BYTES32_EXAMPLE, BYTES_EXAMPLE, STRUCT_DYNAMIC_SIZE_EXAMPLE, STRUCT_FIXED_SIZE_EXAMPLE } from 'test/utils';
import { ethers } from 'hardhat';

chai.should();
chai.use(lopt.matchers);

describe('ProgrammableFunctionLogic: Type Handling', () => {
  let fake: FakeContract<Returner>;

  beforeEach(async () => {
    fake = await lopt.fake<Returner>('Returner');
  });

  context('fixed data types', () => {
    describe('default behaviors', () => {
      it('should return false for a boolean', async () => {
        expect(await fake.callStatic.getBoolean()).to.equal(false);
      });

      it('should return zero for a uint256', async () => {
        expect(await fake.callStatic.getUint256()).to.equal(BigNumber.from('0'));
      });

      it('should return 32 zero bytes for a bytes32', async () => {
        const expected = '0x0000000000000000000000000000000000000000000000000000000000000000';
        expect(await fake.callStatic.getBytes32()).to.equal(expected);
      });
    });

    describe('from a specified value', () => {
      it('should be able to return a boolean', async () => {
        const expected = true;
        fake.getBoolean.returns(expected);

        expect(await fake.callStatic.getBoolean()).to.equal(expected);
      });

      it('should be able to return a uint256', async () => {
        const expected = utils.parseUnits('1');
        fake.getUint256.returns(expected);

        expect(await fake.callStatic.getUint256()).to.equal(expected);
      });

      it('should be able to return a bytes32', async () => {
        const expected = BYTES32_EXAMPLE;
        fake.getBytes32.returns(expected);

        expect(await fake.callStatic.getBytes32()).to.equal(expected);
      });
    });
  });

  context('dynamic data types', () => {
    describe('from a specified value', () => {
      it('should be able to return a bytes value', async () => {
        const expected = BYTES_EXAMPLE;
        fake.getBytes.returns(expected);

        expect(await fake.callStatic.getBytes()).to.equal(expected);
      });

      it('should be able to return a string value', async () => {
        const expected = 'this is an expected return string';
        fake.getString.returns(expected);

        expect(await fake.callStatic.getString()).to.equal(expected);
      });

      it('should be able to return a struct with fixed size values', async () => {
        const expected = STRUCT_FIXED_SIZE_EXAMPLE;
        fake.getStructFixedSize.returns(expected);

        const result = toPlainObject(await fake.callStatic.getStructFixedSize());
        expect(result.valBoolean).to.equal(expected.valBoolean);
        expect(result.valUint256).to.deep.equal(expected.valUint256);
        expect(result.valBytes32).to.equal(expected.valBytes32);
      });

      it('should be able to return a struct with dynamic size values', async () => {
        const expected = STRUCT_DYNAMIC_SIZE_EXAMPLE;
        fake.getStructDynamicSize.returns(expected);

        const result = toPlainObject(await fake.callStatic.getStructDynamicSize());
        expect(result.valBytes).to.equal(expected.valBytes);
        expect(result.valString).to.equal(expected.valString);
      });

      it('should be able to return a struct with both fixed and dynamic size values', async () => {
        const expected = {
          ...STRUCT_FIXED_SIZE_EXAMPLE,
          ...STRUCT_DYNAMIC_SIZE_EXAMPLE,
        };
        fake.getStructMixedSize.returns(expected);

        const result = toPlainObject(await fake.callStatic.getStructMixedSize());
        expect(result.valBoolean).to.equal(expected.valBoolean);
        expect(result.valUint256).to.deep.equal(expected.valUint256);
        expect(result.valBytes32).to.equal(expected.valBytes32);
        expect(result.valBytes).to.equal(expected.valBytes);
        expect(result.valString).to.equal(expected.valString);
      });

      it('should be able to return a nested struct', async () => {
        const expected = {
          valStructFixedSize: STRUCT_FIXED_SIZE_EXAMPLE,
          valStructDynamicSize: STRUCT_DYNAMIC_SIZE_EXAMPLE,
        };
        fake.getStructNested.returns(expected);

        const result = toPlainObject(await fake.callStatic.getStructNested());
        expect(result.valStructFixedSize[0]).to.deep.equal(expected.valStructFixedSize.valBoolean);
        expect(result.valStructFixedSize[1]).to.deep.equal(expected.valStructFixedSize.valUint256);
        expect(result.valStructFixedSize[2]).to.deep.equal(expected.valStructFixedSize.valBytes32);
        expect(result.valStructDynamicSize[0]).to.deep.equal(expected.valStructDynamicSize.valBytes);
        expect(result.valStructDynamicSize[1]).to.deep.equal(expected.valStructDynamicSize.valString);
      });

      it('should be able to return an array of uint256 values', async () => {
        const expected = [1234, 2345, 3456, 4567, 5678, 6789].map((n) => {
          return BigNumber.from(n);
        });
        fake.getArrayUint256.returns(expected);

        const result = await fake.callStatic.getArrayUint256();
        for (let i = 0; i < result.length; i++) {
          expect(result[i]).to.deep.equal(expected[i]);
        }
      });

      it('should be able to return multiple arrays of uint256 values', async () => {
        const expected = [
          [1234, 2345, 3456, 4567, 5678, 6789].map((n) => {
            return BigNumber.from(n);
          }),
          [1234, 2345, 3456, 4567, 5678, 6789].map((n) => {
            return BigNumber.from(n);
          }),
        ];
        fake.getMultipleUint256Arrays.returns(expected);

        const result = await fake.callStatic.getMultipleUint256Arrays();
        for (let i = 0; i < result.length; i++) {
          for (let j = 0; j < result[i].length; j++) {
            expect(result[i][j]).to.deep.equal(expected[i][j]);
          }
        }
      });
    });
  });

  context('fallback function', () => {
    const EMPTY_ANSWER = '0x' + '00'.repeat(2048);

    it('should return with no data by default', async () => {
      expect(await ethers.provider.call({ to: fake.address })).to.equal(EMPTY_ANSWER);
    });

    it('should be able to return with empty data', async () => {
      fake.fallback.returns();

      expect(
        await ethers.provider.call({
          to: fake.address,
        })
      ).to.equal(EMPTY_ANSWER);
    });

    it('should be able to return simple data', async () => {
      const expected = '0x1234123412341234';
      fake.fallback.returns(expected);

      expect(
        await ethers.provider.call({
          to: fake.address,
        })
      ).to.equal(expected);
    });

    it('should be able to return complex data as hex', async () => {
      fake.fallback.returns([1, 2, 3]);

      expect(
        await ethers.provider.call({
          to: fake.address,
        })
      ).to.equal('0x010203');
    });
  });
});
