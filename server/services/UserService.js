//引入哈希库
const md5 = require("md5");
//引入随机值产生器库
const Chance = require("chance");
const chance = new Chance();
//引入文件模块
const fs = require("fs");

const UserModel = require("../models/UserModel");


/**
 * 查询集合内是否存在某一元素，返回布尔值
 */
const checkExist = async (filter) => {
    try {
        var result = await UserModel.findOne(filter);
    } catch (err) {
        result = null;
    }
    return Boolean(result);
};

const UserService = {

    /**
     * 查询用户名与密码是否匹配，不匹配返回false，匹配返回查询值
     *
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

    addUser: async ({ username, password }) => {
        //首先查找是否存在该用户名，存在则返回 -1
        var result = await UserModel.findOne({
            username
        });
        if (result.length !== 0) return -1;

        //添加用户信息，待完善
    },

    /**
     * 更新数据库中的用户名等信息
     * 
     * @returns _id字段校验出错，返回-1；
     * 新用户名已经被他人使用，返回-2；
     * 校验成功返回0
     */
    upload: async ({ _id, username, introduction, gender, avatar }) => {
        //检查_id字段是否存在
        let exist = await checkExist({ _id });
        if (!exist) {
            return -1;
        }

        //检查新用户名是否已经被他人使用
        exist = await checkExist({ _id, username });
        //如果该用户更新了username
        if (!exist) {
            //检查该username是否被别人使用
            exist = await checkExist({ username });
            if (exist) {
                return -2;
            }
        }

        //如果avatar不为null，说明头像被修改，需要删除原头像
        if (avatar) {
            const old = await UserModel.findById(_id);
            const oldAvatar = old.avatar;
            await UserModel.updateOne({ _id }, {
                username, introduction, gender, avatar
            });
            fs.unlink("./public" + oldAvatar, (err) => {
                console.log(err);
            });
            return 0;
        }
        //如果avatar为null，不更新该字段
        else {
            await UserModel.updateOne({ _id }, {
                username, introduction, gender
            });
            return 0;
        }
    }
};

module.exports = UserService;