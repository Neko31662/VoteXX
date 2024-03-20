const UserService = require("../services/UserService");
const JWT = require("../util/JWT");

const UserController = {
    /**
     * 处理登录请求
     */
    login: async (req, res) => {

        //拆解出数据后，调用Service层的方法来处理
        var result = await UserService.login(req.body);
        if (!result) {
            res.send({
                code: "-1",
                error: "用户名密码不匹配"
            });
        } else {
            //生成token
            const token = JWT.generate({
                _id: result[0]._id,
                username: result[0].username
            }, `${JWT.EXPIRES}`);

            //挂在res的header上
            res.header("Authorization", token);

            res.send({
                ActionType: "ok",
                data: {
                    username: result[0].username,
                    gender: result[0].gender,
                    introduction: result[0].introduction,
                    avatar: result[0].avatar,
                    role: result[0].role
                }
            });
        }
    },

    /**
     * 处理更新请求
     */
    upload: async (req, res) => {
        const { username, introduction, gender } = req.body;
        const token = req.headers["authorization"].split(" ")[1];
        const payload = JWT.verify(token);
        const _id = payload ? payload._id : "###";

        let avatar = null;
        try {
            avatar = `/avataruploads/${req.file.filename}`;
        } catch (err) {
            avatar = "";
        }


        let result = await UserService.upload({
            _id, username, introduction, gender: Number(gender), avatar
        });
        if (result === -1) {
            res.send({ error: "未找到该用户" });
        } else if (result === -2) {
            res.send({ error: "用户名已被使用" });
        } else {
            res.send({ ActionType: "OK" });
        }
    }
};

module.exports = UserController;