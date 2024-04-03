const axios = require("axios");
const os = require('os');
const { ServerAddress } = require("./config");
const { exit } = require("process");

//获取运行时传入的参数
const args = process.argv.slice(2);

const port = args[0];
const username = args[1];
const password = args[2];

axios
    .post(ServerAddress + "/trusteeapi/trustee/register", { port, username, password })
    .then((res) => {
        if (res.data.error) {
            console.log(res.data.error);
            process.exit(0);
        } else {
            console.log("认证成功");
        }
    })
    .catch((err) => {
        console.log(err);
        process.exit(1);
    });