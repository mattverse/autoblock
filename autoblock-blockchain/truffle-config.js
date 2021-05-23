const HDWalletProvider = require("truffle-hdwallet-provider");
const fs = require("fs");
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    abs_nonceconsor_matt1028_matt1028: {
      network_id: "*",
      gasPrice: 0,
      provider: new HDWalletProvider(fs.readFileSync('/Users/matt/Desktop/code/block-carcrypt/smart_contract.env', 'utf-8'), "https://matt1028.blockchain.azure.com:3200/6PCowb1Gb_Abx-HtMyGHfDt_")
    }
  },
  compilers: {
    solc: {
      version: "0.7.0"
    }
  }
};
