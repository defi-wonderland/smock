// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Caller {
  function call(address _target, bytes memory _data) public {
    _target.call(_data);
  }
}
