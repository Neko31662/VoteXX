const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//限制集合中每个文档的属性以及类型
const UserType = {
    username: {
        type:String,
        unique:true,//用户名不可重复
        required:true 
    },
    password: String,
    salt: String,
    gender: Number, //未指定0，男1，女2
    introduction: String,
    avatar: String, // 头像
    role: Number //角色：根管理员0，普通管理员1，普通用户2，EA3
};

//创建的模型为"user"，则对应的mongoDB集合名称为"users"
const UserModel = mongoose.model("user", new Schema(UserType));

module.exports = UserModel;