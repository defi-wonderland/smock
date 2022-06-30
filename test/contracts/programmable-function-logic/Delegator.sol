// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import 'hardhat/console.sol';

contract Delegator {
  function delegateGetBoolean(address _addy) external returns (bool) {
    (, bytes memory _data) = _addy.delegatecall(abi.encodeWithSignature('getBoolean()'));
    return abi.decode(_data, (bool));
  }
}
