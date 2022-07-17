// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

struct StructFixedSize {
  bool valBoolean;
  uint256 valUint256;
  bytes32 valBytes32;
}

struct StructDynamicSize {
  bytes valBytes;
  string valString;
}

struct StructMixedSize {
  bool valBoolean;
  uint256 valUint256;
  bytes32 valBytes32;
  bytes valBytes;
  string valString;
}

struct StructNested {
  bool externalValBoolean;
  StructFixedSize valStructFixedSize;
  StructDynamicSize valStructDynamicSize;
}

contract Receiver {
  fallback() external {}

  function receiveEmpty() public payable {}

  function receiveBoolean(bool) public {}

  function receiveUint256(uint256) public {}

  function receiveUint32(uint32) public {}

  function receiveMultipleUintMixed(uint256, uint32) public {}

  function receiveBytes32(bytes32) public {}

  function receiveBytes(bytes memory) public {}

  function receiveString(string memory) public {}

  function receiveMultiple(
    bool,
    StructDynamicSize memory,
    uint256,
    string memory
  ) public {}

  function receiveStructFixedSize(StructFixedSize memory) public {}

  function receiveStructDynamicSize(StructDynamicSize memory) public {}

  function receiveStructMixedSize(StructMixedSize memory) public {}

  function receiveStructNested(StructNested memory) public {}

  function receiveUint256Array(uint256[] memory) public {}

  function receiveMultipleUint256Arrays(uint256[] memory, uint256[] memory) public {}

  function receiveOverload(bool) public {}

  function receiveOverload(bool, bool) public {}
}
