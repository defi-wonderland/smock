// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Counter {
  address public deployer;
  uint256 public count;

  constructor(uint256 _startAt) {
    count = _startAt;
    deployer = msg.sender;
  }

  function add(uint256 _amount) external {
    count += _amount;
  }
}
