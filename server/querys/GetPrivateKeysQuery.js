const axios = require("axios");

const BN = require('bn.js');
const elliptic = require('elliptic');
const EC = elliptic.ec;
const ec = require("../../crypt/primitiv/ec/ec");
const ElgamalPublicKey = require('../../crypt/primitiv/encryption/ElgamalEncryption').ElgamalPublicKey;
const crypto = require('crypto');
var SHA256 = require('crypto-js/sha256');

const { serialize, deserialize } = require('../../crypt/util/CryptoSerializer');
const { getAllTrusteeAddress } = require("./methods");

/**
 * 获取trustee的整体私钥
 * @param {String} voteID 
 * 成功返回私钥;
 * 获取trustee服务地址列表失败返回-1;
 * 第一步失败返回-2; 
 */
const doGetPrivateKeysQuery = async (voteID) => {
    //获取trustee服务地址列表
    let addressList = null;
    try {
        addressList = await getAllTrusteeAddress(voteID);
    } catch (err) {
        return -100;
    }
    if (!Array.isArray(addressList)) return -1;
    let EACount = addressList.length;

    //第一步--发送请求
    let queryPromises1 = [];
    for (let i in addressList) {
        queryPromises1[i] =
            axios.post(addressList[i] + "/ea-vote/get-private-key", {
                voteID
            });
    }
    //第一步--处理结果
    let response1 = null;
    let privateKeys = [];
    try {
        response1 = await Promise.all(queryPromises1);
    } catch (err) {
        return -2;
    }
    response1.forEach((res, index) => {
        if (res.data.ActionType !== "ok") return -2;
        privateKeys[index] = deserialize(res.data.data, ec);
    });

    let privateKey = new BN(0);
    for (let i = 0; i < EACount; i++) {
        privateKey = privateKey.add(new BN(privateKeys[i]));
    }

    return privateKey;
};

const GetPrivateKeysQuery = async (voteID) => {
    let result = await doGetPrivateKeysQuery(voteID);
    if (result <= -2 && result !== -100) throw "GetPrivateKeysQueryErr";
    else if (typeof result === "number") throw "OtherErr";
    return result;
};

module.exports = GetPrivateKeysQuery;