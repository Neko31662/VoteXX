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
                error: "用户名密码不匹配"
            });
        } else {
            //生成token
            const token = JWT.generate({
                _id: result[0]._id,
                username: result[0].username
            }, "user");

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
        const _id = req.payload ? req.payload._id : "###";

        let avatar = null;
        try {
            avatar = `/avataruploads/${req.file.filename}`;
        } catch (err) {
            avatar = "";
        }

        const result = await UserService.upload({
            _id, username, introduction, gender: Number(gender), avatar
        });
        if (result === -1) {
            res.send({ error: "未找到该用户" });
        } else if (result === -2) {
            res.send({ error: "用户名已被使用" });
        } else if (result === -3) {
            res.send({ error: "用户名长度过长" });
        } else {
            //token中的内容变化，更新token
            const newToken = JWT.generate({
                _id,
                username
            }, "user");
            res.header("Authorization", newToken);

            //返回新的用户数据
            const data = { username, introduction, gender: Number(gender) };
            if (avatar) data.avatar = avatar;
            res.send({
                ActionType: "ok",
                data
            });
            return;
        }
    },

    /**
     * 处理查询用户名是否存在的请求
     */
    checkUsernameValid: async (req, res) => {
        const { username } = req.query;

        //用户名字段为空直接判否，正常流程下不会进入这一分支
        if (!username) {
            res.send({ UsernameValid: false });
            return;
        }

        const result = await UserService.checkUsernameValid(username);
        res.send({ UsernameValid: result });
        return;
    },

    /**
     * 处理注册用户的请求
     */
    signup: async (req, res) => {

        const result = await UserService.addUser(req.body);
        if (result === 0) {
            res.send({ ActionType: "ok" });
            return;
        } else {
            res.send({ ActionType: "fail" });
            return;
        }
    }
};

module.exports = UserController;