// const axios = require("axios");

// const BN = require('bn.js');
// const elliptic = require('elliptic');
// const EC = elliptic.ec;
// const ec = require("../../crypt/primitiv/ec/ec");
// const crypto = require('crypto');
// var SHA256 = require('crypto-js/sha256');
// const { ElgamalEnc } = require('../../crypt/primitiv/encryption/ElgamalEncryption');

// const { serialize, deserialize } = require('../../crypt/util/CryptoSerializer');

// const { getAllTrusteeAddress } = require("./methods");
// const GetPrivateKeysQuery = require("./GetPrivateKeysQuery");
// const TryUntilSuccess = require("../util/TryUntilSuccess");

// const VoteModel = require("../models/VoteModel");

// const doProvisionalTallyQuery = async (voteID) => {
//     //获取所有trustee的私钥
//     let privKey = await TryUntilSuccess(GetPrivateKeysQuery, 10000, "GetPrivateKeysQueryErr", voteID);

//     let voteInfo = null;
//     try {
//         voteInfo = await VoteModel.findOne({ _id: voteID });
//     } catch (err) {
//         return -100;
//     }
//     if (!voteInfo) return -1;

//     //反序列化
//     let votes = [];
//     for (let i = 0; i < voteInfo.BB.votes.length; i++) {
//         votes[i] = {};
//         votes[i].enc_pk = deserialize(voteInfo.BB.votes[i].enc_pk, ec);
//         votes[i].signature = deserialize(voteInfo.BB.votes[i].signature, ec);
//     }

//     //获取解密后的pk
//     let ballot_pks = votes.map(vote => vote.enc_pk);
//     for (let i = 0; i < ballot_pks.length; i++) {
//         let plainPK = ElgamalEnc.decrypt(privKey, ballot_pks[i], ec);
//         votes[i].plainPK = plainPK;
//     }

//     //验证签名有效性，筛选出有效的pk
//     let validPks = [];
//     for (let i = 0; i < voteInfo.BB.votes.length; i++) {
//         let publicKey = ec.keyFromPublic(votes[i].plainPK);
//         let isValid = publicKey.verify(String(voteID), votes[i].signature);
//         if (isValid) {
//             validPks.push(votes[i].plainPK);
//         } else {
//         }
//     }

//     //创建map，key为pk_yes和pk_no，value为它们在shuffled_plain_pks数组中的序号
//     let { shuffled_plain_pks } = voteInfo.BB;
//     let pk_yes_index = new Map();
//     let pk_no_index = new Map();
//     for (let i = 0; i < shuffled_plain_pks.length; i++) {
//         pk_yes_index.set(shuffled_plain_pks[i].pk_yes, i);
//         pk_no_index.set(shuffled_plain_pks[i].pk_no, i);
//     }

//     //获得投票结果：0代表未投票，1代表赞成票，2代表反对票，一个用户多次投票，后面的会覆盖前面的
//     let voteResults = shuffled_plain_pks.map(() => 0);
//     for (let pk of validPks) {
//         let pk_serialized = serialize(pk);
//         if (pk_yes_index.has(pk_serialized)) {
//             let index = pk_yes_index.get(pk_serialized);
//             voteResults[index] = 1;
//         } else if (pk_no_index.has(pk_serialized)) {
//             let index = pk_no_index.get(pk_serialized);
//             voteResults[index] = 2;
//         } else {
//         }
//     }

//     //统计投票结果：
//     let yesVotes = [];//所有投了yes票的投票者的pk_no
//     let noVotes = [];//所有投了no票的投票者的pk_yes
//     let nr_yes = 0;//yes票数
//     let nr_no = 0;//no票数

//     for (let i = 0; i < voteResults.length; i++) {
//         if (voteResults[i] === 1) {
//             nr_yes++;
//             yesVotes.push(shuffled_plain_pks[i].pk_no);
//         } else if (voteResults[i] === 2) {
//             nr_no++;
//             noVotes.push(shuffled_plain_pks[i].pk_yes);
//         }
//     }

//     //用随机生成的公钥将yesVotes和noVotes的长度填充至2的幂
//     if (yesVotes.length === 0) {
//         yesVotes.push(serialize(ec.genKeyPair().getPublic()));
//     } else {
//         let listSizeLog = Math.ceil(Math.log2(yesVotes.length));
//         let listSize = Math.pow(2, listSizeLog);
//         for (let i = yesVotes.length; i < listSize; i++) {
//             yesVotes.push(serialize(ec.genKeyPair().getPublic()));
//         }
//     }
//     if (noVotes.length === 0) {
//         noVotes.push(serialize(ec.genKeyPair().getPublic()));
//     } else {
//         let listSizeLog = Math.ceil(Math.log2(noVotes.length));
//         let listSize = Math.pow(2, listSizeLog);
//         for (let i = noVotes.length; i < listSize; i++) {
//             noVotes.push(serialize(ec.genKeyPair().getPublic()));
//         }
//     }

//     try {
//         await VoteModel.updateOne({ _id: voteID }, {
//             "BB.yesVotes": yesVotes,
//             "BB.noVotes": noVotes,
//             "BB.results.nr_yes": nr_yes,
//             "BB.results.nr_no": nr_no,
//         });
//     } catch (err) {
//         return -100;
//     }

//     return 0;
// };

// const provisionalTallyQuery = async (voteID) => {
//     let result = await doProvisionalTallyQuery(voteID);
//     if (result !== 0) throw "provisionalTallyQueryErr";
// };

// module.exports = provisionalTallyQuery;