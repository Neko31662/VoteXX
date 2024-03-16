const UserService = require("../../Services/admin/UserService");
const JWT = require("../../util/JWT");

const UserController = {
    login: async (req, res) => {

        //拆解出数据后，调用Service层的方法来处理
        var result = await UserService.login(req.body);
        if (result.length === 0) {
            res.send({
                code: "-1",
                error: "用户名密码不匹配"
            });
        } else {
            //生成token
            const token = JWT.generate({
                id: result[0]._id,
                username: result[0].username
            }, `${JWT.EXPIRES}`);

            //挂在res的header上
            res.header("Authorization",token);

            res.send({
                ActionType: "ok"
            });
        }
    }
};

module.exports = UserController;