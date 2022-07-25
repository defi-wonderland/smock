// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface ICounter {
  function count() external returns (uint256);

  function add(uint256 _amount) external;
}

contract RaceCondition {
  uint256 public value;
  ICounter public counter;

  constructor(address counter_) {
    counter = ICounter(counter_);
  }

  function updateValue() external {
    counter.add(1);

    value = counter.count();
  }
}
