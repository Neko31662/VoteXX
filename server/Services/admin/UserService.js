const UserModel = require("../../models/UserModel");

const UserService = {
    //查询是否存在名称与密码完全匹配的数据
    //注意UserModel.find方法返回一个数组
    login: async ({ username, password }) => {
        return UserModel.find({
            username,
            password
        });
    }
};

module.exports = UserService;