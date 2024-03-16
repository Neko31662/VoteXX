const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//限制集合中每个文档的属性以及类型
const UserType = {
    username: String,
    password: String,
    gender: Number,
    introduction: String,
    avatar: String, // 头像
    role: Number //角色：管理员1，编辑2
};

//创建的模型为"user"，则对应的mongoDB集合名称为"users"
const UserModel = mongoose.model("user", new Schema(UserType));

module.exports = UserModel;