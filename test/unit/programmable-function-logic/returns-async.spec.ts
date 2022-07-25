import { MockContract, smock } from '@src';
import { Counter, RaceCondition, RaceCondition__factory } from '@typechained';
import chai, { expect } from 'chai';
import { ethers } from 'hardhat';

chai.should();
chai.use(smock.matchers);

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe.only('ProgrammableFunctionLogic: Returns async', () => {
  let mockRaceCondition: MockContract<RaceCondition>;
  let mockCounter: MockContract<Counter>;
  let counter: Counter;

  beforeEach(async () => {
    const counterFactory = await ethers.getContractFactory('Counter');
    counter = await counterFactory.deploy(1);

    const raceConditionFactory = await smock.mock<RaceCondition__factory>('RaceCondition');
    mockRaceCondition = await raceConditionFactory.deploy(counter.address);
  });

  describe('returns async', () => {
    it('increase counter inside async callback', async () => {
      let verifier = 42;

      mockRaceCondition.updateValue.returns(async () => {
        try {
          verifier += 1;

          await counter.add(5);

          // After increasing the counter, state variable is indeed updated
          expect(await counter.count()).to.equal(7);
        } catch (e) {
          // Printing the error because the exception gets lost in Smock
          console.log(e);
        }
      });

      await mockRaceCondition.updateValue();

      // This demonstrates that the callback is called
      expect(verifier).to.equal(43);

      // However the counter is not updated anymore
      expect(await mockRaceCondition.value()).to.equal(7);
    });
    it('increase counter outside async callback', async () => {
      let verifier = 42;

      mockRaceCondition.updateValue.returns(async () => {
        verifier += 1;

        try {
          // The state variable is correctly updated here
          expect(await counter.count()).to.equal(7);
        } catch (e) {
          // Printing the error because the exception gets lost in Smock
          console.log(e);
        }
      });

      // Increase the counter outside the callback
      await counter.add(5);

      await mockRaceCondition.updateValue();

      // This demonstrates that the callback is called
      expect(verifier).to.equal(43);

      // And the counter is still with the correct value
      expect(await mockRaceCondition.value()).to.equal(7);
    });
  });
});
