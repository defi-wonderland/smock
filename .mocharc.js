module.exports = {
  require: ['hardhat/register'],
  extension: ['.ts'],
  ignore: ['./test/utils/**'],
  recursive: true,
  exit: true,
  timeout: process.env.MOCHA_TIMEOUT || 300000,
};
