const jsonwebtoken = require("jsonwebtoken");
const Chance = require("chance");
const chance = new Chance();


//常量，token有效期，单位：秒
const userTokenExpires = 60 * 60 * 24; //1d
const voteTokenExpires = 0;//不过期

//token密钥，根据有效期时间轮换
const userSecretKeyArray = [];
const voteSecretKeyArray = [];

const initKeys = (keyArray, expires) => {
    /*---开发阶段，将密钥设为常量---*/
    for (let i = 0; i <= 1; i++) {
        keyArray[i] = "neko31662";
    }
    return;
    /*---开发阶段，将密钥设为常量---*/

    for (let i = 0; i <= 1; i++) {
        keyArray[i] = chance.string({ length: 64 });
    }
    if (expires) {
        setInterval((keyArray) => {
            keyArray[0] = keyArray[1];
            keyArray[1] = chance.string({ length: 64 });
        }, expires * 1000);
    }
};

initKeys(userSecretKeyArray, userTokenExpires);
initKeys(voteSecretKeyArray, voteTokenExpires);


const JWT = {

    /**
     * 生成token
     * @param {*} value token的值
     * @param {*} tokenType 字符串，指定token类型，
     * 可选项："user", "vote"
     * @returns 生成的token
     */
    generate: (value, tokenType) => {
        let keyArray = [];
        let expires = 0;
        switch (tokenType) {
            case "user":
                keyArray = userSecretKeyArray;
                expires = userTokenExpires;
                break;
            case "vote":
                keyArray = voteSecretKeyArray;
                expires = voteTokenExpires;
                break;
            default:
                throw "Invalid tokenType";
        }
        if (expires) {
            return jsonwebtoken.sign(value, keyArray[1], { expiresIn: expires });
        } else {
            return jsonwebtoken.sign(value, keyArray[1], {});
        }

    },

    /**
     * 验证token
     * @param {*} token token的值
     * @param {*} tokenType 字符串，指定token类型，
     * 可选项："user", "vote"
     * @returns 验证成功返回解密后token，否则返回false
     */
    verify: (token, tokenType) => {
        let keyArray = [];
        switch (tokenType) {
            case "user":
                keyArray = userSecretKeyArray;
                break;
            case "vote":
                keyArray = voteSecretKeyArray;
                break;
            default:
                throw "Invalid tokenType";
        }

        let result = null;
        for (let i = 0; i <= 1; i++) {
            try {
                result = jsonwebtoken.verify(token, keyArray[i]);
            } catch (err) {
                result = false;
            }
            if (result) return result;
        }
        return result;
    }
};

module.exports = JWT;