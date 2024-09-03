const axios = require("axios");
const { getAllTrusteeAddress } = require("./methods");
const { serialize, deserialize } = require("../../crypt/util/Serializer");
const { VerifiableShuffle } = require("../../crypt/protocol/shuffle_argument/ShuffleArgument");
const { PedersenPublicKey } = require("../../crypt/primitiv/commitment/pedersen_commitment");
const { decryptQuery } = require("./DKGQuery");

const VoteModel = require("../models/VoteModel");

/**
 * 对一个序列化的ElGamal密文（向量）数组进行混洗，返回序列化后的混洗结果
 * @param {string} voteID 
 * @param {string} ck_serialized 
 * @param {string} input_ctxts_serialized 
 * @param {number} m 
 * @returns {string}
 */
const doShuffleQuery = async (
    voteID, ck_serialized, input_ctxts_serialized, m = 2
) => {

    //获取trustee服务地址列表
    let addressList = null;
    try {
        addressList = await getAllTrusteeAddress(voteID);
    } catch (err) {
        return -100;
    }
    if (!Array.isArray(addressList)) return -1;
    let EACount = addressList.length;

    //第一步--所有Trustee依次混洗
    let shuffled_ctxts_list_serialized = [];
    let shuffleProof_list_serialized = [];
    for (let i = 0; i < EACount; i++) {
        let res;
        try {
            res = await axios.post(addressList[i] + "/ea-vote/shuffle/step1", {
                voteID,
                ck_serialized,
                input_ctxts_serialized: i === 0 ? input_ctxts_serialized : shuffled_ctxts_list_serialized[i - 1],
                m
            });
        } catch (err) {
            return -2;
        }

        if (res.data.ActionType !== "ok") return -2;
        shuffled_ctxts_list_serialized[i] = res.data.data.output_ctxts_serialized;
        shuffleProof_list_serialized[i] = res.data.data.shuffleProof_serialized;
    }

    //第二步--发送请求
    let queryPromises2 = [];
    let data = {
        input_ctxts_serialized,
        ck_serialized,
        shuffled_ctxts_list_serialized,
        shuffleProof_list_serialized,
        EACount,
        m
    };
    for (let i in addressList) {
        queryPromises2[i] =
            axios.post(addressList[i] + "/ea-vote/shuffle/step2", {
                voteID,
                data
            });
    }
    //第二步--处理结果
    let response2 = null;
    try {
        response2 = await Promise.all(queryPromises2);
    } catch (err) {
        return -3;
    }
    response2.forEach((res, index) => {
        if (res.data.ActionType !== "ok") return -3;
        if (res.data.data !== true) return -4;
    });

    return shuffled_ctxts_list_serialized[EACount - 1];
};

/**
 * 对一个序列化的ElGamal密文（向量）数组进行混洗，返回序列化后的混洗结果
 * @param {string} voteID 
 * @param {string} ck_serialized 
 * @param {string} input_ctxts_serialized 
 * @param {number} m 
 * @returns {string}
 */
const shuffleQuery = async (
    voteID, ck_serialized, input_ctxts_serialized, m = 2
) => {
    let result = await doShuffleQuery(voteID, ck_serialized, input_ctxts_serialized, m);
    if (result <= -2 && result !== -100) throw new Error("shuffleQueryErr");
    else if (result === -100) throw new Error("DatabaseErr");
    return result;
};

const shuffleAfterRegQuery = async (voteID) => {
    const ec = require('../../crypt/primitiv/ec/ec');

    //获取trustee服务地址列表
    let addressList = null;
    try {
        addressList = await getAllTrusteeAddress(voteID);
    } catch (err) {
        throw new Error("DatabaseErr");
    }
    if (!Array.isArray(addressList)) throw new Error("shuffleAfterRegQueryErr");
    let EACount = addressList.length;

    //获取BB的信息——election_pk和pks
    let voteInfo = null;
    try {
        voteInfo = await VoteModel.findOne({ _id: voteID });
    } catch (err) {
        throw new Error("DatabaseErr");
    }

    let pk_length = voteInfo.BB.pks.length;
    if (pk_length === 0) return 0;
    let enc_pk_list = [];
    for (let i = 0; i < pk_length; i++) {
        enc_pk_list[i] = [];
        enc_pk_list[i][0] = deserialize(voteInfo.BB.pks[i].enc_pk_yes, ec);
        enc_pk_list[i][1] = deserialize(voteInfo.BB.pks[i].enc_pk_no, ec);
    }
    let enc_pk_list_serialized = serialize(enc_pk_list);


    let m = Math.max(2, Math.ceil(Math.log10(pk_length)));
    let n = Math.ceil(pk_length / m);
    let ck = new PedersenPublicKey(ec, n);
    let ck_serialized = serialize(ck);
    let shuffled_enc_pk_list_serialized = await shuffleQuery(
        voteID, ck_serialized, enc_pk_list_serialized, m
    );

    let shuffled_enc_pk_list = deserialize(shuffled_enc_pk_list_serialized, ec);
    const shuffled_plain_pks = [];
    for (let i = 0; i < pk_length; i++) {
        let shuffled_pk_yes = await decryptQuery(ec, voteID, serialize(shuffled_enc_pk_list[i][0]));
        let shuffled_pk_no = await decryptQuery(ec, voteID, serialize(shuffled_enc_pk_list[i][1]));
        shuffled_plain_pks[i] = {
            pk_yes: serialize(shuffled_pk_yes),
            pk_no: serialize(shuffled_pk_no)
        };
    }

    try {
        await VoteModel.updateOne({ _id: voteID }, {
            $set: {
                "BB.shuffled_plain_pks": shuffled_plain_pks
            }
        });
    } catch (err) {
        throw new Error("DatabaseErr");
    }

    return 0;
};

module.exports = {
    shuffleQuery,
    shuffleAfterRegQuery
};