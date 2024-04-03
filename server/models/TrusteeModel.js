const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//限制集合中每个文档的属性以及类型
const TrusteeType = {
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
    address: {
        type: String,
        required: true,
        default: ""
    }
};

const TrusteeModel = mongoose.model("trustee", new Schema(TrusteeType));

module.exports = TrusteeModel;