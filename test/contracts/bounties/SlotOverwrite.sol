// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract SlotOverwrite {
  address public storedAddress;
  bool public isWritten;

  constructor(address _storedAddress) {
    storedAddress = _storedAddress;
  }
  

}
