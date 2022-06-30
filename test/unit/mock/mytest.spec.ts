import { MockContract, MockContractFactory, smock } from '@src';
import { ADDRESS_EXAMPLE } from '@test-utils';
import { Bug, Bug__factory } from '@typechained';
import { expect } from 'chai';

describe('Bug Fix', () => {
  let bugFactory: MockContractFactory<Bug__factory>;
  let mock: MockContract<Bug>;

  before(async () => {
    bugFactory = await smock.mock('Bug');
  });

  beforeEach(async () => {
    mock = await bugFactory.deploy();
  });

  describe('setVariable', () => {
    it('should be able to fix slot overwrite on packed variables', async () => {
      await mock.setVariable('myAddress', ADDRESS_EXAMPLE);
      await mock.setVariable('myBool', true);
      console.log(await mock.myAddress());
      expect(await mock.myAddress()).to.equal(ADDRESS_EXAMPLE);
    });
  });
});
