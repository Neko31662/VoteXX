const axios = require("axios");

const BN = require('bn.js');
const elliptic = require('elliptic');
const EC = elliptic.ec;
const crypto = require('crypto');
var SHA256 = require('crypto-js/sha256');

const { DKG } = require('../../crypt/protocol/DKG/dkg');
const { serialize, deserialize } = require('../../crypt/util/CryptoSerializer');
const { getAllTrusteeAddress } = require("./methods");

/**
 * 向所有trustee发送DKG的请求
 * @param {String} voteID 投票的_id
 * @returns 
 * 成功返回##待确定##;
 * 获取trustee服务地址列表失败返回-1;
 */
const DKGQuery = async (voteID) => {

    //获取trustee服务地址列表
    const addressList = await getAllTrusteeAddress(voteID);
    if (!Array.isArray(addressList)) return -1;

    //第一步
    let queryPromises1 = [];
    for (let i in addressList) {
        queryPromises1[i] =
            axios.post(addressList[i] + "/ea-vote/dkg/step1", {
                voteID
            });
    }

    let response1 = [];
    try {
        response1 = await Promise.all(queryPromises1);
    } catch (err) {
        console.log("err:-2");
        return -2;
    }
    response1.forEach((res, index) => {
        console.log(res.data);
    });
};

module.exports = {
    DKGQuery
}


