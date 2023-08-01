import { MockContract, MockContractFactory, smock } from '@src';
import { Test, Test__factory } from '@typechained';
import chai, { expect } from 'chai';

chai.use(smock.matchers);

describe.only('Skills', () => {
  let test: MockContract<Test>;
  let testFactory: MockContractFactory<Test__factory>;

  before(async () => {
    testFactory = await smock.mock('Test');
  });

  beforeEach(async () => {
    test = await testFactory.deploy();
  });

  const list = [0, 0, 0, 0, 1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  // notice list.length = 36

  describe('test', async () => {
    it('should return list values in the correct order', async () => {
      await test.setVariable('list', {
        0: list,
      });

      const result = await test.get_list(0);
      console.log(result);

      expect(result).to.deep.eq(list);
    });

    it('should return theList values in the correct order', async () => {
      await test.setVariable('theList', list);
      const result = await test.get_theList();
      console.log(result);

      expect(result).to.deep.eq(list);
    });

    it('should return theList256 values in the correct order', async () => {
      await test.setVariable('theList256', [1,2,3,4]);
      const result = await test.get_theList256();
      console.log(result);

      expect(result).to.deep.eq([1,2,3,4]);
    });

    it('should or shouldnt allow an input value longer than 32 bytes', async () => {
      await test.setVariable('list', {
        // list has 36 spots, if first 4 are not left blank it reverts
        0: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      });
    });
  });
});
