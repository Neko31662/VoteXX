// const axios = require("axios");

// const BN = require('bn.js');
// const elliptic = require('elliptic');
// const EC = elliptic.ec;
// const ec = require("../../crypt/primitiv/ec/ec");
// const crypto = require('crypto');
// var SHA256 = require('crypto-js/sha256');
// const { ShuffleArgument, shuffleArray } = require('../../crypt/protocol/NIZKs/verifiable_shuffle/shuffle_argument.js');
// const cmt_PublicKey = require('../../crypt/primitiv/Commitment/pedersen_commitment').PublicKey;
// const enc_PublicKey = require('../../crypt/primitiv/encryption/ElgamalEncryption').ElgamalPublicKey;
// const { ElgamalEnc } = require('../../crypt/primitiv/encryption/ElgamalEncryption');
// const { serialize, deserialize } = require('../../crypt/util/CryptoSerializer');

// const { getAllTrusteeAddress } = require("./methods");
// const GetPrivateKeysQuery = require("./GetPrivateKeysQuery");
// const TryUntilSuccess = require("../util/TryUntilSuccess");

// const VoteModel = require("../models/VoteModel");

// const shuffle = (ctxts, com_pk, pk, permutation) => {
//     let m = 2;
//     let [preparedCtxts, n] = ShuffleArgument.prepare_ctxts(ctxts, m, pk);
//     let mn = preparedCtxts.length;
//     let randomizers = [];
//     for (let i = 0; i < mn; i++) {
//         randomizers.push(ec.genKeyPair().getPrivate());
//     }
//     let shuffledCtxts = [];
//     permutation.forEach((permuted_index, index) => {
//         shuffledCtxts.push(pk.reencrypt(preparedCtxts[permuted_index], randomizers[index]));
//     });

//     let ctxtsReshaped = ShuffleArgument.reshape_m_n(preparedCtxts, m);
//     let shuffledCtxtsReshaped = ShuffleArgument.reshape_m_n(shuffledCtxts, m);
//     let permutationReshaped = ShuffleArgument.reshape_m_n(permutation, m);
//     let randomizersReshaped = ShuffleArgument.reshape_m_n(randomizers, m);

//     let proof = new ShuffleArgument(com_pk, pk, ctxtsReshaped, shuffledCtxtsReshaped, permutationReshaped, randomizersReshaped);

//     return [proof, ctxtsReshaped, shuffledCtxts, shuffledCtxtsReshaped];
// };

// const doShuffleQuery = async (voteID) => {
//     //获取trustee服务地址列表
//     let addressList = null;
//     try {
//         addressList = await getAllTrusteeAddress(voteID);
//     } catch (err) {
//         return -100;
//     }
//     if (!Array.isArray(addressList)) return -1;
//     let EACount = addressList.length;

//     //获取BB的信息——election_pk和pks
//     let voteInfo = null;
//     try {
//         voteInfo = await VoteModel.findOne({ _id: voteID });
//     } catch (err) {
//         return -100;
//     }
//     let election_pk = deserialize(voteInfo.BB.election_pk, ec);
//     election_pk = new enc_PublicKey(ec, election_pk);
//     let pk_length = voteInfo.BB.pks.length;
//     let pk_yes = [];
//     let pk_no = [];
//     for (let i = 0; i < pk_length; i++) {
//         pk_yes[i] = deserialize(voteInfo.BB.pks[i].enc_pk_yes, ec);
//         pk_no[i] = deserialize(voteInfo.BB.pks[i].enc_pk_no, ec);
//     }

//     //获取所有trustee的私钥
//     let privKey = await TryUntilSuccess(GetPrivateKeysQuery, 10000, "GetPrivateKeysQueryErr", voteID);

//     let shuffledPkYes = {};
//     let shuffledPkNo = {};
//     if (pk_yes.length >= 2) {
//         let m = 2;
//         let [preparedCtxts, n] = ShuffleArgument.prepare_ctxts(pk_yes, m, election_pk);
//         let com_pk = new cmt_PublicKey(ec, n);
//         let mn = preparedCtxts.length;
//         let permutation = shuffleArray(Array.from({ length: mn }, (_, i) => i));
//         let [proof, ctxtsReshaped, shuffledCtxts, shuffledCtxtsReshaped] = shuffle(preparedCtxts, com_pk, election_pk, permutation);
//         shuffledPkYes = { shuffledCtxts, proof, ctxtsReshaped, shuffledCtxtsReshaped };

//         [preparedCtxts, n] = ShuffleArgument.prepare_ctxts(pk_no, m, election_pk);
//         [proof, ctxtsReshaped, shuffledCtxts, shuffledCtxtsReshaped] = shuffle(preparedCtxts, com_pk, election_pk, permutation);
//         shuffledPkNo = { shuffledCtxts, proof, ctxtsReshaped, shuffledCtxtsReshaped };
//     } else {
//         shuffledPkYes = { shuffledCtxts: pk_yes };
//         shuffledPkNo = { shuffledCtxts: pk_no };
//     }


//     const shuffled_pks_yes = shuffledPkYes.shuffledCtxts.map(ctxt => ElgamalEnc.decrypt(privKey, ctxt, ec));
//     const shuffled_pks_no = shuffledPkNo.shuffledCtxts.map(ctxt => ElgamalEnc.decrypt(privKey, ctxt, ec));

//     const shuffled_plain_pks = [];
//     for (let i = 0; i < shuffled_pks_yes.length; i++) {
//         shuffled_plain_pks[i] = {
//             pk_yes: serialize(shuffled_pks_yes[i]),
//             pk_no: serialize(shuffled_pks_no[i])
//         };
//     }

//     try {
//         await VoteModel.updateOne({ _id: voteID }, {
//             $set: {
//                 "BB.shuffled_plain_pks": shuffled_plain_pks
//             }
//         });
//     } catch (err) {
//         return -100;
//     }

//     return 0;
// };

// const shuffleQuery = async (voteID) => {
//     let result = await doShuffleQuery(voteID);
//     if (result !== 0) throw "shuffleQueryErr";
// };

// module.exports = shuffleQuery;

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
    // console.log("DKGQuery result:", result);
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
    let enc_pk_list = [];
    for (let i = 0; i < pk_length; i++) {
        enc_pk_list[i] = [];
        enc_pk_list[i][0] = deserialize(voteInfo.BB.pks[i].enc_pk_yes,ec);
        enc_pk_list[i][1] = deserialize(voteInfo.BB.pks[i].enc_pk_no,ec);
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