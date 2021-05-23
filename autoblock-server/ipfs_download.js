// npm install --save @pinata/sdk

const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK('575c8bf8dbab6d1be6f9', '5489f8418e678e185705612147e8722c536626a75252c269520367f532144365');

// pinata.testAuthentication().then((result) => {
//     //handle successful authentication here
//     console.log(result);
// }).catch((err) => {
//     //handle error here
//     console.log(err);
// });

const fs = require('fs');
const readableStreamForFile = fs.createReadStream('main.js');

pinata.pinFileToIPFS(readableStreamForFile).then((result) => {
    //handle results here
    console.log(result);
}).catch((err) => {
    //handle error here
    console.log(err);
});