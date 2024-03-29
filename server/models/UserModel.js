const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//限制集合中每个文档的属性以及类型
const UserType = {
    username: {
        type: String,
        unique: true,//用户名不可重复
        required: true
    },
    password: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    },
    //性别，未指定0，男1，女2
    gender: {
        type: Number,
        default: 0
    },
    introduction: {
        type: String,
        default: ""
    },
    //头像
    avatar: {
        type: String,
        default: ""
    },
    //角色：管理员1，普通用户2，trustee3
    role: {
        type: Number,
        required: true
    }
};

//创建的模型为"user"，则对应的mongoDB集合名称为"users"
const UserModel = mongoose.model("user", new Schema(UserType));

module.exports = UserModel;