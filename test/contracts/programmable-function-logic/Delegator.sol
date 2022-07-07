// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Delegator {
  function delegateGetBoolean(address _addy) external returns (bool) {
    // solhint-disable-next-line avoid-low-level-calls
    (, bytes memory _data) = _addy.delegatecall(abi.encodeWithSignature('getBoolean()'));
    return abi.decode(_data, (bool));
  }
}
