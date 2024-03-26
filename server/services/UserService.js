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

/**
 * 判断用户名是否合法
 * @param {*} username 用户名
 * @returns 布尔值
 */
const checkUsernameLegal = (username) => {
    if (!username || username.length > 32) return false;
    return true;
};

/**
 * 判断密码是否合法
 * @param {*} password 
 * @returns 布尔值
 */
const checkPasswordLegal = (password) => {
    if (!password || password.length < 8 || password.length > 64) return false;
    const hasDigit = /[0-9]/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNonASCII = /[^\x00-\x7F]/.test(password);
    if (!hasDigit || !hasLetter || hasNonASCII) return false;
    return true;
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

    /**
     * 向数据库添加用户信息
     * @returns 
     * 成功返回添加后的结构体;
     * 用户名或密码不合法返回-1;
     * 用户名重复返回-2;
     */
    addUser: async ({ username, password }) => {
        //验证用户名和密码是否合法
        if (!checkUsernameLegal(username) || !checkPasswordLegal(password)) return -1;

        //查找是否存在该用户名，存在则返回 -2
        let result = await checkExist({ username });
        if (result) return -2;

        //添加用户信息
        const salt = chance.string({ length: 64 });
        const password_hash = md5(password + salt);
        let result2 = await UserModel.create({
            username,
            salt,
            password: password_hash,
            role: 2,
        });
        return result2;
    },

    /**
     * 更新数据库中的用户名等信息
     * 
     * @returns _id字段校验出错，返回-1；
     * 新用户名已经被他人使用，返回-2；
     * 新用户名不合法，返回-3；
     * 校验成功返回0
     */
    upload: async ({ _id, username, introduction, gender, avatar }) => {
        if (!checkUsernameLegal(username)) return -3;

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
            if (oldAvatar) {
                fs.unlink("./public" + oldAvatar, (err) => {
                    console.log(err);
                });
            }
            return 0;
        }
        //如果avatar为null，不更新该字段
        else {
            await UserModel.updateOne({ _id }, {
                username, introduction, gender
            });
            return 0;
        }
    },

    /**
     * 查询某一用户名是否可用（不存在），返回bool值
     * @param {*} username 待查询用户名
     */
    checkUsernameValid: async (username) => {
        return ! await checkExist({ username });
    }
};

module.exports = UserService;