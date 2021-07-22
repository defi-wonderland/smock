import chai, { expect } from 'chai';
import { FakeContract, lopt } from '@src';
import { Returner } from '@typechained';

chai.should();
chai.use(lopt.matchers);

describe('ProgrammableFunctionLogic: Reset', () => {
  let fake: FakeContract<Returner>;

  beforeEach(async () => {
    fake = await lopt.fake<Returner>('Returner');
  });

  it('should be able to revert without reason', async () => {
    fake.getBoolean.reverts();

    await expect(fake.callStatic.getBoolean()).to.be.reverted;
  });

  it('should be able to cancel revert with a reset', async () => {
    fake.getBoolean.reverts();
    fake.getBoolean.reset();

    await expect(fake.callStatic.getBoolean()).to.not.be.reverted;
  });

  it('should be able to revert with a string value', async () => {
    const reason = 'a crazy problem';
    fake.getBoolean.reverts(reason);

    await expect(fake.callStatic.getBoolean()).to.be.revertedWith(reason);
  });
});
