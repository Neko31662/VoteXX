const axios = require("axios");
const { getAllTrusteeAddress } = require("./methods");
const { serialize, deserialize } = require("../../crypt/util/Serializer");
const { ElgamalCiphertext_exec } = require("../../crypt/primitiv/encryption/ElGamal");
const { decryptQuery } = require("./DKGQuery");

const VoteModel = require("../models/VoteModel");

const PETQuery = async (voteID, ctxt1_serialized, ctxt2_serialized) => {
    const ec = require('../../crypt/primitiv/ec/ec');

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
            axios.post(addressList[i] + "/ea-vote/pet/step1", {
                voteID,
                ctxt1_serialized,
                ctxt2_serialized
            });
    }
    //第一步--处理结果
    let response1 = null;
    let c_zList_serialized = [];
    try {
        response1 = await Promise.all(queryPromises1);
    } catch (err) {
        throw new Error("PETQueryErr");
    }
    response1.forEach((res, index) => {
        if (res.data.ActionType !== "ok") throw new Error("PETQueryErr");
        c_zList_serialized[index] = res.data.data;
    });

    //第二步--发送请求
    let queryPromises2 = [];
    for (let i in addressList) {
        queryPromises2[i] =
            axios.post(addressList[i] + "/ea-vote/pet/step2", {
                voteID,
                ctxt1_serialized,
                ctxt2_serialized,
                c_zList_serialized
            });
    }
    //第二步--处理结果
    let response2 = null;
    let statementList = [];
    let proofList = [];
    try {
        response2 = await Promise.all(queryPromises2);
    } catch (err) {
        throw new Error("PETQueryErr");
    }
    response2.forEach((res, index) => {
        if (res.data.ActionType !== "ok") throw new Error("PETQueryErr");
        statementList[index] = res.data.data.statement;
        proofList[index] = res.data.data.proof;
    });

    //第三步--发送请求
    let queryPromises3 = [];
    for (let i in addressList) {
        queryPromises3[i] =
            axios.post(addressList[i] + "/ea-vote/pet/step3", {
                voteID,
                ctxt1_serialized,
                ctxt2_serialized,
                statementList,
                proofList
            });
    }
    //第三步--处理结果
    let response3 = null;
    try {
        response3 = await Promise.all(queryPromises3);
    } catch (err) {
        throw new Error("PETQueryErr");
    }
    let ctxt_sum;
    response3.forEach((res, index) => {
        if (res.data.ActionType !== "ok") throw new Error("PETQueryErr");
        if (!res.data.data) throw new Error("PETQueryErr");
        if (index === 0) {
            ctxt_sum = deserialize(res.data.data, ec);
        } else {
            let tmp = deserialize(res.data.data, ec);
            if (!ElgamalCiphertext_exec.eq(ctxt_sum, tmp)) throw new Error("PETQueryErr");
        }
    });

    let plain = await decryptQuery(ec, voteID, serialize(ctxt_sum));
    return Boolean(plain.isInfinity());
};

module.exports = { PETQuery };