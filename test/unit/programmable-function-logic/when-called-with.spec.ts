import { FakeContract, smock } from '@src';
import { PickyReturner } from '@typechained';
import { expect } from 'chai';

describe('ProgrammableFunctionLogic: When called with', () => {
  let fake: FakeContract<PickyReturner>;

  beforeEach(async () => {
    fake = await smock.fake<PickyReturner>('PickyReturner');
  });

  describe('returns', () => {
    it('should override default behaviour', async () => {
      fake.getUint256.returns(1);
      fake.getUint256.whenCalledWith(123).returns(456);

      expect(await fake.callStatic.getUint256(123)).to.equal(456);
    });

    it('should override itself', async () => {
      fake.getUint256.whenCalledWith(123).returns(1);
      fake.getUint256.whenCalledWith(123).returns(2);

      expect(await fake.callStatic.getUint256(123)).to.equal(2);
    });

    it('should be reseted', async () => {
      fake.getUint256.whenCalledWith(123).returns(1);
      fake.getUint256.reset();
      fake.getUint256.returns(2);

      expect(await fake.callStatic.getUint256(123)).to.equal(2);
    });

    it('should live together with default', async () => {
      fake.getUint256.returns(1);
      fake.getUint256.whenCalledWith(123).returns(456);

      expect(await fake.callStatic.getUint256(122)).to.equal(1);
      expect(await fake.callStatic.getUint256(123)).to.equal(456);
    });

    it('should handle multiple calls', async () => {
      fake.getUint256.whenCalledWith(1).returns(10);
      fake.getUint256.whenCalledWith(2).returns(20);

      expect(await fake.callStatic.getUint256(1)).to.equal(10);
      expect(await fake.callStatic.getUint256(2)).to.equal(20);
    });
  });

  describe('reverts', () => {
    it('should override default behaviour', async () => {
      fake.getUint256.reverts('a');
      fake.getUint256.whenCalledWith(123).reverts('b');

      await expect(fake.callStatic.getUint256(123)).to.be.revertedWith('b');
    });

    it('should override itself', async () => {
      fake.getUint256.whenCalledWith(123).reverts('a');
      fake.getUint256.whenCalledWith(123).reverts('b');

      await expect(fake.callStatic.getUint256(123)).to.be.revertedWith('b');
    });

    it('should be reseted', async () => {
      fake.getUint256.whenCalledWith(123).reverts('a');
      fake.getUint256.reset();

      await expect(fake.callStatic.getUint256(123)).not.to.be.reverted;
    });

    it('should live together with default', async () => {
      fake.getUint256.reverts('a');
      fake.getUint256.whenCalledWith(123).reverts('b');

      await expect(fake.callStatic.getUint256(122)).to.be.revertedWith('a');
      await expect(fake.callStatic.getUint256(123)).to.be.revertedWith('b');
    });

    it('should handle multiple calls', async () => {
      fake.getUint256.whenCalledWith(1).reverts('a');
      fake.getUint256.whenCalledWith(2).reverts('b');

      await expect(fake.callStatic.getUint256(1)).to.be.revertedWith('a');
      await expect(fake.callStatic.getUint256(2)).to.be.revertedWith('b');
    });
  });
});
