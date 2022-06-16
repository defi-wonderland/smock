import { MockContract, MockContractFactory, smock } from '@src';
import { ADDRESS_EXAMPLE } from '@test-utils';
import { SlotOverwrite, SlotOverwrite__factory } from '@typechained';
import { expect } from 'chai';

describe.only('Mock: Editable storage logic', () => {
  let slotOverwriteFactory: MockContractFactory<SlotOverwrite__factory>;
  let mock: MockContract<SlotOverwrite>;

  before(async () => {
    slotOverwriteFactory = await smock.mock('SlotOverwrite');
  });

  beforeEach(async () => {
    mock = await slotOverwriteFactory.deploy(ADDRESS_EXAMPLE);
  });

  describe('slot overwrite bug', ()=>{
    context('on normal conditions', ()=>{
      it('should return the data on the queried slot', async()=>{
        expect(await mock.storedAddress()).to.eq(ADDRESS_EXAMPLE)
      })
    })

    context('when a bool is set next to the slot', ()=>{
      beforeEach(async()=>{
          await mock.setVariable('isWritten',true)
      })
      it('should return the data on the queried slot', async()=>{
        expect(await mock.storedAddress()).to.eq(ADDRESS_EXAMPLE)
      })
    })

    it('should describe other data types reached by bug')
    it('should present correspondant tests')
  })

});
