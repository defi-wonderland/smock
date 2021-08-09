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

struct ComplexStruct {
  int56 value;
}

contract StorageGetter {
  address internal _address;
  uint256 internal _constructorUint256;
  uint256 internal _uint256;
  bool internal _bool;
  SimpleStruct internal _simpleStruct;
  PackedStruct internal _packedStruct;
  ComplexStruct internal _complexStruct;
  mapping(uint256 => uint256) _uint256Map;
  mapping(uint256 => mapping(uint256 => uint256)) _uint256NestedMap;
  mapping(bytes5 => bool) _bytes5ToBoolMap;
  mapping(address => bool) _addressToBoolMap;
  mapping(address => address) _addressToAddressMap;

  // Testing storage slot packing.
  bool internal _packedA;
  address internal _packedB;

  constructor(uint256 _inA) {
    _constructorUint256 = _inA;
  }

  function getConstructorUint256() public view returns (uint256 _out) {
    return _constructorUint256;
  }

  function getUint256() public view returns (uint256 _out) {
    return _uint256;
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

  function getComplexStruct() public view returns (ComplexStruct memory _out) {
    return _complexStruct;
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

  function getPackedAddress() public view returns (address) {
    return _packedB;
  }
}
