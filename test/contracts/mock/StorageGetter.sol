// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

struct SimpleStruct {
  uint256 valueA;
  bool valueB;
}

struct PackedStruct {
  bool packedA;
  address packedB;
}

contract StorageGetter {
  address internal _address;
  uint256 internal _constructorUint256;
  int56 internal _int56;
  int256 internal _int256;
  uint256 internal _uint256;
  bytes internal _bytes;
  bytes32 internal _bytes32;
  bool internal _bool;
  SimpleStruct internal _simpleStruct;
  PackedStruct internal _packedStruct;
  mapping(uint256 => uint256) _uint256Map;
  mapping(uint256 => mapping(uint256 => uint256)) _uint256NestedMap;
  mapping(bytes5 => bool) _bytes5ToBoolMap;
  mapping(address => bool) _addressToBoolMap;
  mapping(address => address) _addressToAddressMap;
  uint256[] internal _uint256Array;

  // Testing storage slot packing.
  bool internal _packedA;
  address internal _packedB;

  // Testing slot-overwrite
  address public _slotA;
  bool public _slotB;

  constructor(uint256 _inA) {
    _constructorUint256 = _inA;
  }

  function getConstructorUint256() public view returns (uint256 _out) {
    return _constructorUint256;
  }

  function getInt56() public view returns (int56 _out) {
    return _int56;
  }

  function getInt256() public view returns (int256 _out) {
    return _int256;
  }

  function getUint256() public view returns (uint256 _out) {
    return _uint256;
  }

  function getBytes() public view returns (bytes memory _out) {
    return _bytes;
  }

  function getBytes32() public view returns (bytes32 _out) {
    return _bytes32;
  }

  function setPackedA(bool _val) external {
    _packedA = _val;
  }

  function setPackedB(address _val) external {
    _packedB = _val;
  }

  function setUint256(uint256 _in) public {
    _uint256 = _in;
  }

  function getBool() public view returns (bool _out) {
    return _bool;
  }

  function getAddress() public view returns (address _out) {
    return _address;
  }

  function getSimpleStruct() public view returns (SimpleStruct memory _out) {
    return _simpleStruct;
  }

  function getPackedStruct() public view returns (PackedStruct memory _out) {
    return _packedStruct;
  }

  function getUint256MapValue(uint256 _key) public view returns (uint256 _out) {
    return _uint256Map[_key];
  }

  function getNestedUint256MapValue(uint256 _keyA, uint256 _keyB) public view returns (uint256 _out) {
    return _uint256NestedMap[_keyA][_keyB];
  }

  function getBytes5ToBoolMapValue(bytes5 _key) public view returns (bool _out) {
    return _bytes5ToBoolMap[_key];
  }

  function getAddressToBoolMapValue(address _key) public view returns (bool _out) {
    return _addressToBoolMap[_key];
  }

  function getAddressToAddressMapValue(address _key) public view returns (address _out) {
    return _addressToAddressMap[_key];
  }

  function getUint256Array() public view returns (uint256[] memory _out) {
    return _uint256Array;
  }

  function getPackedAddress() public view returns (address) {
    return _packedB;
  }
}
