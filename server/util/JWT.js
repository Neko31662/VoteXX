const jsonwebtoken = require("jsonwebtoken");
const secretKeys = require("../config/secretkey.config.js");
const secret = secretKeys.jwtSecret;

const JWT = {
    //常量，token有效期
    EXPIRES: "1d",

    /**
     * 生成token
     * @param {*} value token的值
     * @param {*} expires 有效期长度，不传入时不会过期
     * @returns 生成的token
     */
    generate: (value, expires) => {
        if(expires){
            return jsonwebtoken.sign(value, secret, { expiresIn: expires });
        }else{
            return jsonwebtoken.sign(value, secret, {});
        }
        
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