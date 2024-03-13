// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

struct SimpleStruct {
  uint256 valueA;
  bool valueB;
}

struct PackedStruct {
  uint16 packedA;
  uint16 packedB;
  uint16 packedC;
  uint16 packedD;
  address packedE;
}

struct OtherPackedStruct {
  address packedA;
  bytes12 packedB;
}

contract StorageGetter {
  uint16 _packedUintA;
  uint16 _packedUintB;
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
  mapping(bytes32 => bool) _bytes32ToBoolMap;
  mapping(address => bool) _addressToBoolMap;
  mapping(address => address) _addressToAddressMap;
  uint256[] internal _uint256Array;
  int16[][] internal _int2DArray;
  mapping(bytes32 => SimpleStruct) _bytes32ToSimpleStructMap;
  mapping(bytes32 => PackedStruct) _bytes32ToPackedStructMap;
  mapping(bytes32 => OtherPackedStruct) _bytes32ToOtherPackedStructMap;

  // Testing storage slot packing.
  bool internal _packedA;
  address internal _packedB;

  constructor(uint256 _inA) {
    _constructorUint256 = _inA;
  }

  function getConstructorUint256() public view returns (uint256 _out) {
    return _constructorUint256;
  }

  function getPackedUintA() public view returns (uint16 _out) {
    return _packedUintA;
  }

  function getPackedUintB() public view returns (uint16 _out) {
    return _packedUintB;
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

  function setPackedUintA(uint16 _val) external {
    _packedUintA = _val;
  }

  function setPackedUintB(uint16 _val) external {
    _packedUintB = _val;
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

  function getBytes32ToBoolMapValue(bytes32 _key) public view returns (bool _out) {
    return _bytes32ToBoolMap[_key];
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

  function getInt2D16Array() public view returns (int16[][] memory _out) {
    return _int2DArray;
  }

  function getPackedAddress() public view returns (address) {
    return _packedB;
  }

  function getBytes32ToSimpleStructMapValue(bytes32 _key) public view returns (SimpleStruct memory _out) {
    return _bytes32ToSimpleStructMap[_key];
  }

  function getBytes32ToPackedStructMapValue(bytes32 _key) public view returns (PackedStruct memory _out) {
    return _bytes32ToPackedStructMap[_key];
  }

  function getBytes32ToOtherPackedStructMapValue(bytes32 _key) public view returns (OtherPackedStruct memory _out) {
    return _bytes32ToOtherPackedStructMap[_key];
  }
}
