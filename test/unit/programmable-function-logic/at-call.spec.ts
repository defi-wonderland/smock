import chai, { expect } from 'chai';
import { FakeContract, lopt } from '@lib';
import { Returner } from '@typechained';

chai.should();
chai.use(lopt.matchers);

describe('ProgrammableFunctionLogic: At call', () => {
  let fake: FakeContract<Returner>;

  beforeEach(async () => {
    fake = await lopt.fake<Returner>('Returner');
  });

  describe('returns', () => {
    it('should override default behaviour', async () => {
      fake.getString.returns('a');
      fake.getString.returnsAtCall(0, 'b');

      expect(await fake.callStatic.getString()).to.equal('b');
    });

    it('should override itself', async () => {
      fake.getString.returnsAtCall(0, 'a');
      fake.getString.returnsAtCall(0, 'b');

      expect(await fake.callStatic.getString()).to.equal('b');
    });

    it('should be reseted', async () => {
      fake.getString.returnsAtCall(0, 'a');
      fake.getString.reset();
      fake.getString.returns('b');

      expect(await fake.callStatic.getString()).to.equal('b');
    });

    it('should live together with default', async () => {
      fake.getString.returns('a');
      fake.getString.returnsAtCall(1, 'b');

      expect(await fake.callStatic.getString()).to.equal('a');
      expect(await fake.callStatic.getString()).to.equal('b');
      expect(await fake.callStatic.getString()).to.equal('a');
    });

    it('should change value by call', async () => {
      fake.getString.returnsAtCall(0, 'a');
      fake.getString.returnsAtCall(1, 'b');

      expect(await fake.callStatic.getString()).to.equal('a');
      expect(await fake.callStatic.getString()).to.equal('b');
    });
  });

  describe('reverts', () => {
    it('should override default behaviour', async () => {
      fake.getString.reverts('a');
      fake.getString.revertsAtCall(0, 'b');

      await expect(fake.callStatic.getString()).to.be.revertedWith('b');
    });

    it('should override itself', async () => {
      fake.getString.revertsAtCall(0, 'a');
      fake.getString.revertsAtCall(0, 'b');

      await expect(fake.callStatic.getString()).to.be.revertedWith('b');
    });

    it('should be reseted', async () => {
      fake.getString.revertsAtCall(0, 'a');
      fake.getString.reset();

      await expect(fake.callStatic.getString()).not.to.be.reverted;
    });

    it('should live together with default', async () => {
      fake.getString.reverts('a');
      fake.getString.revertsAtCall(1, 'b');

      await expect(fake.callStatic.getString()).to.be.revertedWith('a');
      await expect(fake.callStatic.getString()).to.be.revertedWith('b');
      await expect(fake.callStatic.getString()).to.be.revertedWith('a');
    });

    it('should change value by call', async () => {
      fake.getString.revertsAtCall(0, 'a');
      fake.getString.revertsAtCall(1, 'b');

      await expect(fake.callStatic.getString()).to.be.revertedWith('a');
      await expect(fake.callStatic.getString()).to.be.revertedWith('b');
    });
  });
});
