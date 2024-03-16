const jsonwebtoken = require("jsonwebtoken");
const secret = "kerwin";

const JWT = {
    //常量，token有效期
    EXPIRES : "1d",

    //生成token，传入：值，有效期长度
    generate: (value, expires) => {
        return jsonwebtoken.sign(value, secret, { expiresIn: expires });
    },

    //验证token，传入token，验证成功返回解密后token，否则返回false
    verify: (token) => {
        try {
            return jsonwebtoken.verify(token, secret);
        } catch (err) {
            return false;
        }

    }
};

module.exports = JWT;