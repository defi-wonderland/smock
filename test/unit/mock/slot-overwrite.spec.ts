import { MockContract, MockContractFactory, smock } from '@src';
import { ADDRESS_EXAMPLE, ADDRESS_EXAMPLE2, ADDRESS_EXAMPLE3 } from '@test-utils';
import { Bug, Bug__factory } from '@typechained';
import { expect } from 'chai';

describe('Mock: Slot Overwrite', () => {
  let bugFactory: MockContractFactory<Bug__factory>;
  let mock: MockContract<Bug>;

  before(async () => {
    bugFactory = await smock.mock('Bug');
  });

  beforeEach(async () => {
    mock = await bugFactory.deploy();
  });

  describe('setVariable', () => {
    it('should not be able to overwrite slot', async () => {
      await mock.setVariable('myAddress', ADDRESS_EXAMPLE);
      await mock.setVariable('myBool', true);
      await mock.setVariable('newAddress', ADDRESS_EXAMPLE2);
      await mock.setVariable('newAddress2', ADDRESS_EXAMPLE3);
      await mock.setVariable('newBool', false);
      await mock.setVariable('newBool2', true);
      expect(await mock.myAddress()).to.equal(ADDRESS_EXAMPLE);
      expect(await mock.myBool()).to.equal(true);
      expect(await mock.newAddress()).to.equal(ADDRESS_EXAMPLE2);
      expect(await mock.newAddress2()).to.equal(ADDRESS_EXAMPLE3);
      expect(await mock.newBool()).to.equal(false);
      expect(await mock.newBool2()).to.equal(true);
    });
  });
});
