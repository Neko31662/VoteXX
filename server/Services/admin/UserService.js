//引入哈希库
const md5 = require("md5");
//引入随机值产生器库
const Chance = require("chance");
const chance = new Chance();

const UserModel = require("../../models/UserModel");

const UserService = {

    /**
     * 查询用户名与密码是否匹配，不匹配返回false，匹配返回查询值
     *
     * @param username - 用户名
     * @param password - 密码
     */
    login: async ({ username, password }) => {
        //首先查找是否存在该用户名
        var result = await UserModel.find({
            username
        });
        if (result.length === 0) return false;

        //若存在该用户，则比对密码的加盐哈希
        let salt = result[0].salt;
        let password_hash = result[0].password;
        if (md5(password + salt) === password_hash) {
            return result;
        } else {
            return false;
        }
    },


    addUser: async({username,password}) =>{
        //首先查找是否存在该用户名，存在则返回 -1
        var result = await UserModel.findOne({
            username
        });
        if (result.length !== 0) return -1;

        //添加用户信息，待完善
    }
};

module.exports = UserService;