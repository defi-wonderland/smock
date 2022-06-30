import { MockContract, MockContractFactory, smock } from '@src';
import { ADDRESS_EXAMPLE } from '@test-utils';
import { StorageGetter, StorageGetter__factory } from '@typechained';
import { expect } from 'chai';

describe('Mock: Editable storage logic', () => {
  let storageGetterFactory: MockContractFactory<StorageGetter__factory>;
  let mock: MockContract<StorageGetter>;

  before(async () => {
    storageGetterFactory = await smock.mock('StorageGetter');
  });

  beforeEach(async () => {
    mock = await storageGetterFactory.deploy(1);
  });

  describe('setVariable', () => {
    it('should be able to fix bug', async () => {
      await mock.setVariable('_address', ADDRESS_EXAMPLE);
      await mock.setVariable('_bool', true);
      expect(await mock.getAddress()).to.equal(ADDRESS_EXAMPLE);
    });
  });
});
