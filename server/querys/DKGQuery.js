const axios = require("axios");

const BN = require('bn.js');
const elliptic = require('elliptic');
const EC = elliptic.ec;
const ec = require("../../crypt/primitiv/ec/ec");
const PublicKey = require('../../crypt/primitiv/encryption/ElgamalEncryption').ElgamalPublicKey;
const crypto = require('crypto');
var SHA256 = require('crypto-js/sha256');

const { DKG } = require('../../crypt/protocol/DKG/dkg');
const { serialize, deserialize } = require('../../crypt/util/CryptoSerializer');
const { getAllTrusteeAddress } = require("./methods");

const VoteModel = require("../models/VoteModel");

/**
 * 向所有trustee发送DKG的请求
 * @param {String} voteID 投票的_id
 * @returns 
 * 成功返回0;
 * 获取trustee服务地址列表失败返回-1;
 * 第一步失败返回-2;
 * 第二步失败返回-3;
 * 第二步验证时发现存在错误的零知识证明返回-4;
 * 第三步失败返回-5;
 * 第三步各方生成的公钥不一致返回-6;
 * 数据库错误返回-100;
 */
const doDKGQuery = async (voteID) => {

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
            axios.post(addressList[i] + "/ea-vote/dkg/step1", {
                voteID
            });
    }
    //第一步--处理结果
    let response1 = null;
    let yiList_serialized = [];
    let proofList_serialized = [];
    try {
        response1 = await Promise.all(queryPromises1);
    } catch (err) {
        return -2;
    }
    response1.forEach((res, index) => {
        if (res.data.ActionType !== "ok") return -2;
        yiList_serialized[index] = res.data.data.yi_serialized;
        proofList_serialized[index] = res.data.data.proof_serialized;
    });

    //第二步--发送请求
    let queryPromises2 = [];
    for (let i in addressList) {
        let params = [];
        for (let j = 0; j < EACount; j++) {
            if (j != i)
                params.push({
                    seq: j,
                    yi_serialized: yiList_serialized[i],
                    proof_serialized: proofList_serialized[i]
                });
        }
        queryPromises2[i] =
            axios.post(addressList[i] + "/ea-vote/dkg/step2", {
                voteID,
                data: params
            });
    }
    //第二步--处理结果
    let response2 = null;
    try {
        response2 = await Promise.all(queryPromises2);
    } catch (err) {
        return -3;
    }
    let success = true;
    response2.forEach((res, index) => {
        if (res.data.ActionType !== "ok") return -3;
        success &= res.data.data;
    });
    if (!success) return -4;

    //第三步--发送请求
    let queryPromises3 = [];
    for (let i in addressList) {
        queryPromises3[i] =
            axios.post(addressList[i] + "/ea-vote/dkg/step3", {
                voteID,
                yiList_serialized
            });
    }
    //第三步--处理结果
    let response3 = null;
    try {
        response3 = await Promise.all(queryPromises3);
    } catch (err) {
        return -5;
    }
    let allSame = true;
    let publicKey = "";
    response3.forEach((res, index) => {
        if (res.data.ActionType !== "ok") return -5;
        if (index === 0) {
            publicKey = res.data.data;
        } else {
            if (publicKey !== res.data.data) allSame = false;
        }
    });
    if (!allSame) return -6;
    let pk = new PublicKey(ec, deserialize(publicKey));

    try {
        await VoteModel.updateOne({ _id: voteID }, {
            $set: {
                "BB.yiList": yiList_serialized,
                "BB.pk": serialize(pk)
            }
        });
    } catch (err) {
        return -100;
    }

    return 0;
};

const DKGQuery = async (voteID) => {
    let result = await doDKGQuery(voteID);
    // console.log("DKGQuery result:", result);
    if (result <= -2 && result !== -100) throw "DKGQueryErr";
    else if (result !== 0) throw "OtherErr";
};

module.exports = DKGQuery


