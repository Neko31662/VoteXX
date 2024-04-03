//引入哈希库
const md5 = require("md5");
const axios = require("axios");
const TrusteeModel = require("../models/TrusteeModel");

const TrusteeService = {
    /**
     * 处理trustee服务进程的认证请求
     * @param {{ ip, port, username, password }} params 
     * 成功返回trustee账户结构体
     * 提供的ip、端口号无法ping通，返回-1
     * trustee账号验证失败，返回-2
     */
    register: async (params) => {
        const { ip, port, username, password } = params;

        //首先验证提供的ip、端口号能否ping通
        const address = "http://" + ip + ":" + port;
        try {
            let res = await axios.get(address + "/ping");
            if (res.data.ActionType !== "ok") {
                return -1;
            }
        } catch (err) {
            return -1;
        }

        //首先查找是否存在该用户名
        try {
            var result = await TrusteeModel.findOne({
                username
            });
        } catch (err) {
            return -100;
        }
        if (!result) return -2;

        //若存在该用户，则比对密码的加盐哈希
        let salt = result.salt;
        let password_hash = result.password;
        if (md5(password + salt) !== password_hash) {
            return -2;
        }

        //在数据库中更新该trustee的地址
        try {
            await TrusteeModel.updateOne({ _id: result._id }, { address });
        } catch (err) {
            return -100;
        }
        return result;
    }
};

module.exports = TrusteeService;