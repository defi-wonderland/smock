// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import './TestLibrary.sol';

contract Librarian {
  function getLibValue() external pure returns (uint256) {
    return TestLibrary.getSomeValue();
  }
}
