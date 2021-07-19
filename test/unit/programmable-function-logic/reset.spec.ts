import chai, { expect } from 'chai';
import { lopt, FakeContract } from '@lib';
import { Returner } from '@typechained';
import { BYTES32_EXAMPLE } from 'test/utils';
import { BigNumber } from 'ethers';

chai.should();
chai.use(lopt.matchers);

describe('ProgrammableFunctionLogic: Reset', () => {
  let fake: FakeContract<Returner>;

  beforeEach(async () => {
    fake = await lopt.fake<Returner>('Returner');
  });

  describe('for a boolean', () => {
    it('should return false after resetting', async () => {
      const expected1 = true;
      fake.getBoolean.returns(expected1);

      expect(await fake.callStatic.getBoolean()).to.equal(expected1);

      const expected2 = false;
      fake.getBoolean.reset();

      expect(await fake.callStatic.getBoolean()).to.equal(expected2);
    });

    it('should be able to reset and change behaviors', async () => {
      const expected1 = true;
      fake.getBoolean.returns(expected1);

      expect(await fake.callStatic.getBoolean()).to.equal(expected1);

      const expected2 = false;
      fake.getBoolean.reset();

      expect(await fake.callStatic.getBoolean()).to.equal(expected2);

      const expected3 = true;
      fake.getBoolean.returns(expected3);

      expect(await fake.callStatic.getBoolean()).to.equal(expected3);
    });
  });

  describe('for a uint256', () => {
    it('should return zero after resetting', async () => {
      const expected1 = 1234;
      fake.getUint256.returns(expected1);

      expect(await fake.callStatic.getUint256()).to.equal(expected1);

      fake.getUint256.reset();
      expect(await fake.callStatic.getUint256()).to.equal(BigNumber.from('0'));
    });

    it('should be able to reset and change behaviors', async () => {
      const expected1 = 1234;
      fake.getUint256.returns(expected1);

      expect(await fake.callStatic.getUint256()).to.equal(expected1);

      fake.getUint256.reset();

      expect(await fake.callStatic.getUint256()).to.equal(BigNumber.from('0'));

      const expected3 = 4321;
      fake.getUint256.returns(expected3);

      expect(await fake.callStatic.getUint256()).to.equal(expected3);
    });
  });

  describe('for a bytes32', () => {
    it('should return 32 zero bytes after resetting', async () => {
      const expected1 = BYTES32_EXAMPLE;
      fake.getBytes32.returns(expected1);

      expect(await fake.callStatic.getBytes32()).to.equal(expected1);

      const expected2 = '0x0000000000000000000000000000000000000000000000000000000000000000';
      fake.getBytes32.reset();

      expect(await fake.callStatic.getBytes32()).to.equal(expected2);
    });

    it('should be able to reset and change behaviors', async () => {
      const expected1 = BYTES32_EXAMPLE;
      fake.getBytes32.returns(expected1);

      expect(await fake.callStatic.getBytes32()).to.equal(expected1);

      const expected2 = '0x0000000000000000000000000000000000000000000000000000000000000000';
      fake.getBytes32.reset();

      expect(await fake.callStatic.getBytes32()).to.equal(expected2);

      const expected3 = '0x4321432143214321432143214321432143214321432143214321432143214321';
      fake.getBytes32.returns(expected3);

      expect(await fake.callStatic.getBytes32()).to.equal(expected3);
    });
  });
});
