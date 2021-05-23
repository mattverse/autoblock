const fs = require('fs');
const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK('575c8bf8dbab6d1be6f9', '5489f8418e678e185705612147e8722c536626a75252c269520367f532144365');
const abi = require('../smartContract.json');
const Web3 = require('web3');

const dotenv = require("dotenv");
dotenv.config();

module.exports = function(router, app){
    router.get("/send_info", async(req, res) => { 
        // const accident_data = xlsx.readFile(__dirname + "/accident_data.xlsx")
        const read_stream_file = fs.createReadStream(__dirname + process.env.DATA_PATH);
        const hash_csv_file = await pinata.pinFileToIPFS(read_stream_file);

        const web3 = new Web3(new Web3.providers.HttpProvider(process.env.BLOCK_PROVIDER));
        const smart_contract = new web3.eth.Contract(abi.abi, '0x829fc45F1eeD12E56cC2bb64cFFb527E1445F8dd');
        await web3.eth.personal.unlockAccount("0x44790ebeA7892dC526cB32BdC199054de91DE81f", process.env.ADDRESS_SECRET)
        const addAccident = await smart_contract.methods.addAccident(hash_csv_file.IpfsHash).send({
            from: '0x44790ebeA7892dC526cB32BdC199054de91DE81f'
        });

        // const getLastAccident = await test_contract.methods.getLastAccident().call();
        // console.log(getLastAccident);
        // const num = await test_contract.methods.getNumberOfAccidents().call();
        // console.log(num);

        res.status(200).send({a: addAccident})
    })

}