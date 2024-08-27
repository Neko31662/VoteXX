// const axios = require("axios");

// const BN = require('bn.js');
// const elliptic = require('elliptic');
// const EC = elliptic.ec;
// const ec = require("../../crypt/primitiv/ec/ec");
// const crypto = require('crypto');
// var SHA256 = require('crypto-js/sha256');

// const { DKG } = require('../../crypt/protocol/DKG/dkg');
// const { serialize, deserialize } = require('../../crypt/util/CryptoSerializer');
// const { getAllTrusteeAddress } = require("./methods");

// const VoteModel = require("../models/VoteModel");

// /**
//  * 向所有trustee发送DKG的请求
//  * @param {String} voteID 投票的_id
//  * @returns 
//  * 成功返回0;
//  * 获取trustee服务地址列表失败返回-1;
//  * 第一步失败返回-2;
//  * 第二步失败返回-3;
//  * 第二步验证时发现存在错误的零知识证明返回-4;
//  * 第二步各方生成的公钥不一致返回-5;
//  * 数据库错误返回-100;
//  */
// const doDKGQuery = async (voteID) => {

//     //获取trustee服务地址列表
//     let addressList = null;
//     try {
//         addressList = await getAllTrusteeAddress(voteID);
//     } catch (err) {
//         return -100;
//     }
//     if (!Array.isArray(addressList)) return -1;
//     let EACount = addressList.length;

//     //第一步--发送请求
//     let queryPromises1 = [];
//     for (let i in addressList) {
//         queryPromises1[i] =
//             axios.post(addressList[i] + "/ea-vote/dkg-gen-key/step1", {
//                 voteID
//             });
//     }
//     //第一步--处理结果
//     let response1 = null;
//     let yiList_serialized = [];
//     let proofList_serialized = [];
//     try {
//         response1 = await Promise.all(queryPromises1);
//     } catch (err) {
//         return -2;
//     }
//     response1.forEach((res, index) => {
//         if (res.data.ActionType !== "ok") return -2;
//         yiList_serialized[index] = res.data.data.yi_serialized;
//         proofList_serialized[index] = res.data.data.proof_serialized;
//     });

//     //第二步--发送请求
//     let queryPromises2 = [];
//     for (let i in addressList) {
//         let params = [];
//         for (let j = 0; j < EACount; j++) {
//             if (j != i)
//                 params.push({
//                     seq: j,
//                     yi_serialized: yiList_serialized[i],
//                     proof_serialized: proofList_serialized[i]
//                 });
//         }
//         queryPromises2[i] =
//             axios.post(addressList[i] + "/ea-vote/dkg-gen-key/step2", {
//                 voteID,
//                 data: params
//             });
//     }
//     //第二步--处理结果
//     let response2 = null;
//     try {
//         response2 = await Promise.all(queryPromises2);
//     } catch (err) {
//         return -3;
//     }
//     let success = true;
//     response2.forEach((res, index) => {
//         if (res.data.ActionType !== "ok") return -3;
//         success &= res.data.data;
//     });
//     if (!success) return -4;

//     //第三步--发送请求
//     let queryPromises3 = [];
//     for (let i in addressList) {
//         queryPromises3[i] =
//             axios.post(addressList[i] + "/ea-vote/dkg-gen-key/step3", {
//                 voteID,
//                 yiList_serialized
//             });
//     }
//     //第三步--处理结果
//     let response3 = null;
//     try {
//         response3 = await Promise.all(queryPromises3);
//     } catch (err) {
//         return -5;
//     }
//     let allSame = true;
//     let publicKey = "";
//     response3.forEach((res, index) => {
//         if (res.data.ActionType !== "ok") return -5;
//         if (index === 0) {
//             publicKey = res.data.data;
//         } else {
//             if (publicKey !== res.data.data) allSame = false;
//         }
//     });
//     if (!allSame) return -6;

//     try {
//         await VoteModel.updateOne({ _id: voteID }, {
//             $set: {
//                 "BB.yiList": yiList_serialized,
//                 "BB.election_pk": publicKey
//             }
//         });
//     } catch (err) {
//         return -100;
//     }

//     return 0;
// };

// const DKGQuery = async (voteID) => {
//     let result = await doDKGQuery(voteID);
//     // console.log("DKGQuery result:", result);
//     if (result <= -2 && result !== -100) throw "DKGQueryErr";
//     else if (result !== 0) throw "OtherErr";
// };

// module.exports = DKGQuery

const axios = require("axios");
const { getAllTrusteeAddress } = require("./methods");
const { deserialize } = require("../../crypt/util/Serializer");
const { DKG_exec } = require("../../crypt/protocol/DKG/DKG");

const VoteModel = require("../models/VoteModel");

/**
 * 向所有trustee发送生成DKG密钥的请求
 * @param {String} voteID 投票的_id
 * @returns 
 * 成功返回0;
 * 获取trustee服务地址列表失败返回-1;
 * 第一步失败返回-2;
 * 第二步失败返回-3;
 * 第二步验证时发现存在错误的零知识证明返回-4;
 * 第二步各方生成的公钥不一致返回-5;
 * 数据库错误返回-100;
 */
const doGenerateKeyQuery = async (voteID) => {

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
            axios.post(addressList[i] + "/ea-vote/dkg-gen-key/step1", {
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
                    yi_serialized: yiList_serialized[j],
                    proof_serialized: proofList_serialized[j]
                });
        }
        queryPromises2[i] =
            axios.post(addressList[i] + "/ea-vote/dkg-gen-key/step2", {
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
    let allSame = true;
    let publicKey = "";
    response2.forEach((res, index) => {
        if (res.data.ActionType !== "ok") return -3;
        if (!res.data.data) return -4;
        if (index === 0) {
            publicKey = res.data.data;
        } else {
            if (publicKey !== res.data.data) allSame = false;
        }
    });
    if (!allSame) return -5;

    try {
        await VoteModel.updateOne({ _id: voteID }, {
            $set: {
                "BB.yiList": yiList_serialized,
                "BB.election_pk": publicKey
            }
        });
    } catch (err) {
        return -100;
    }

    return 0;
};

const generateKeyQuery = async (voteID) => {
    let result = await doGenerateKeyQuery(voteID);
    // console.log("DKGQuery result:", result);
    if (result <= -2 && result !== -100) throw "generateKeyQueryErr";
    else if (result !== 0) throw "OtherErr";
};

/**
 * 对一个序列化的密文进行分布式（Lifted）ElGamal解密，返回明文（未被序列化）
 * @param {EC} ec
 * @param {string} voteID 
 * @param {string} ctxt_serialized 
 * @param {boolean} isLifted 
 * @param {number} min_val 
 * @param {number} max_val 
 * @returns {number | false | Point}
 */
const decryptQuery = async (
    ec, voteID, ctxt_serialized,
    isLifted = false, min_val = 0, max_val = 8192
) => {

    //获取trustee服务地址列表
    let addressList = null;
    try {
        addressList = await getAllTrusteeAddress(voteID);
    } catch (err) {
        throw new Error("DatabaseErr");
    }
    if (!Array.isArray(addressList)) throw new Error("decryptQueryErr");
    let EACount = addressList.length;

    //第一步--发送请求
    let queryPromises1 = [];
    for (let i in addressList) {
        queryPromises1[i] =
            axios.post(addressList[i] + "/ea-vote/dkg-decrypt/step1", {
                voteID,
                ctxt_serialized
            });
    }
    //第一步--处理结果
    let response1 = null;
    let kiList_serialized = [];
    let proofList_serialized = [];
    try {
        response1 = await Promise.all(queryPromises1);
    } catch (err) {
        throw new Error("decryptQueryErr");
    }
    response1.forEach((res, index) => {
        if (res.data.ActionType !== "ok") throw new Error("decryptQueryErr");
        kiList_serialized[index] = res.data.data.ki_serialized;
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
                    ki_serialized: kiList_serialized[j],
                    proof_serialized: proofList_serialized[j]
                });
        }
        queryPromises2[i] =
            axios.post(addressList[i] + "/ea-vote/dkg-decrypt/step2", {
                voteID,
                data: { ctxt_serialized, params }
            });
    }
    //第二步--处理结果
    let response2 = null;
    try {
        response2 = await Promise.all(queryPromises2);
    } catch (err) {
        throw new Error("decryptQueryErr");
    }
    let success = true;
    response2.forEach((res, index) => {
        if (res.data.ActionType !== "ok") throw new Error("decryptQueryErr");
        success &= res.data.data;
    });
    if (!success) throw new Error("decryptQueryErr");

    let kiList = kiList_serialized.map(value => deserialize(value, ec));
    let ctxt = deserialize(ctxt_serialized, ec);
    let plain = DKG_exec.decrypt(ec, ctxt, kiList);
    if (isLifted) {
        assert.ok(max_val >= min_val, "'max_val' should be equal or greater than 'min_val'.");

        let length = max_val - min_val + 1;
        let tmp = new BN(min_val).add(ec.curve.n);
        let cur = ec.curve.g.mul(tmp);
        for (let i = 0; i < length; i++) {
            if (cur.eq(plain)) return min_val + i;
            cur = cur.add(ec.curve.g);
        }
        return false;
    } else {
        return plain;
    }
};

module.exports = {
    generateKeyQuery,
    decryptQuery
};