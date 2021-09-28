contract Test {
  mapping(uint256 => uint8[36]) public list;

  function get_list(uint256 number) public view returns (uint8[36] memory _list) {
    return list[number];
  }

  uint8[36] theList;
  uint256[4] theList256;

  function get_theList() public view returns (uint8[36] memory _theList) {
    return theList;
  }

  function get_theList256() public view returns (uint256[4] memory _theList) {
    return theList256;
  }
}
