const TrusteeService = require("../services/TrusteeService");
const JWT = require("../util/JWT");

const TrusteeController = {
    /**
     * 处理trustee服务进程的认证请求
     */
    register: async (req, res) => {
        //获取ip地址
        let ip = req.socket.remoteAddress;
        //IPv6转IPv4
        if (ip.startsWith("::ffff:")) {
            ip = ip.slice(7);
        }

        //获取端口号、trustee的用户名和密码
        const { port, username, password } = req.body;

        const params = { ip, port, username, password };

        const result = await TrusteeService.register(params);

        if (result === -1) {
            res.send({ error: "Connection failed" });
        } else if (result === -2) {
            res.send({ error: "Authentication failed, account name or password is wrong" });
        } else {
            //生成token
            const token = JWT.generate({
                _id: result._id,
                username: result.username
            }, "user");

            //挂在res的header上
            res.header("Authorization", token);

            res.send({ ActionType: "ok" });
        }

    }
};

module.exports = TrusteeController;