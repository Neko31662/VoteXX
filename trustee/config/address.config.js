const axios = require("axios");
const os = require('os');
const { ServerAddress } = require("./config");

//获取运行时传入的参数
const args = process.argv.slice(2);

const port = args[0];

axios
    .post(ServerAddress + "/trusteeapi/trustee/register", { port })
    .then((res) => {
        console.log(res.data);
    })
    .catch((err) => {
        console.log("err");
    });