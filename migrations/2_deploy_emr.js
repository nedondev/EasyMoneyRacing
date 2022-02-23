const EasyMoneyRacing = artifacts.require("EasyMoneyRacing");
const {
    BN,
  } = require('@openzeppelin/test-helpers');

module.exports = function (deployer) {
  deployer.deploy(EasyMoneyRacing, 100);
};
