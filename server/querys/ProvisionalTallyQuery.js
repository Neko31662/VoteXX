const axios = require("axios");
const { getAllTrusteeAddress } = require("./methods");
const { serialize, deserialize } = require("../../crypt/util/Serializer");
const { decryptQuery } = require("./DKGQuery");

const VoteModel = require("../models/VoteModel");
const { ElgamalEnc } = require("../../crypt/primitiv/encryption/ElGamal");

const doProvisionalTallyQuery = async (voteID) => {
    const ec = require('../../crypt/primitiv/ec/ec');

    let voteInfo = null;
    try {
        voteInfo = await VoteModel.findOne({ _id: voteID });
    } catch (err) {
        return -100;
    }
    if (!voteInfo) return -1;

    //反序列化
    let votes = [];
    for (let i = 0; i < voteInfo.BB.votes.length; i++) {
        votes[i] = {};
        votes[i].enc_pk = deserialize(voteInfo.BB.votes[i].enc_pk, ec);
        votes[i].signature = deserialize(voteInfo.BB.votes[i].signature, ec);
    }

    //获取解密后的pk，signature
    let ballot_pks = votes.map(vote => vote.enc_pk);
    for (let i = 0; i < ballot_pks.length; i++) {
        let plainPK = await decryptQuery(ec, voteID, voteInfo.BB.votes[i].enc_pk);
        votes[i].plainPK = plainPK;
        let encode_r = [];
        for (let j = 0; j < votes[i].signature.r.length; j++) {
            encode_r[j] = await decryptQuery(ec, voteID, serialize(votes[i].signature.r[j]));
        }
        
        votes[i].signature.r = ElgamalEnc.decode(ec, encode_r);

        let encode_s = [];
        for (let j = 0; j < votes[i].signature.s.length; j++) {
            encode_s[j] = await decryptQuery(ec, voteID, serialize(votes[i].signature.s[j]));
        }
        votes[i].signature.s = ElgamalEnc.decode(ec, encode_s);
    }

    //验证签名有效性，筛选出有效的pk
    let validPks = [];
    for (let i = 0; i < voteInfo.BB.votes.length; i++) {
        let publicKey = ec.keyFromPublic(votes[i].plainPK);
        let isValid = publicKey.verify(String(voteID), votes[i].signature);
        if (isValid) {
            validPks.push(votes[i].plainPK);
        } else {
        }
    }

    //创建map，key为pk_yes和pk_no，value为它们在shuffled_plain_pks数组中的序号
    let { shuffled_plain_pks } = voteInfo.BB;
    let pk_yes_index = new Map();
    let pk_no_index = new Map();
    for (let i = 0; i < shuffled_plain_pks.length; i++) {
        pk_yes_index.set(shuffled_plain_pks[i].pk_yes, i);
        pk_no_index.set(shuffled_plain_pks[i].pk_no, i);
    }

    //获得投票结果：0代表未投票，1代表赞成票，2代表反对票，一个用户多次投票，后面的会覆盖前面的
    let voteResults = shuffled_plain_pks.map(() => 0);
    for (let pk of validPks) {
        let pk_serialized = serialize(pk);
        if (pk_yes_index.has(pk_serialized)) {
            let index = pk_yes_index.get(pk_serialized);
            voteResults[index] = 1;
        } else if (pk_no_index.has(pk_serialized)) {
            let index = pk_no_index.get(pk_serialized);
            voteResults[index] = 2;
        } else {
        }
    }

    //统计投票结果：
    let yesVotes = [];//所有投了yes票的投票者的pk_no
    let noVotes = [];//所有投了no票的投票者的pk_yes
    let nr_yes = 0;//yes票数
    let nr_no = 0;//no票数

    for (let i = 0; i < voteResults.length; i++) {
        if (voteResults[i] === 1) {
            nr_yes++;
            yesVotes.push(shuffled_plain_pks[i].pk_no);
        } else if (voteResults[i] === 2) {
            nr_no++;
            noVotes.push(shuffled_plain_pks[i].pk_yes);
        }
    }

    try {
        await VoteModel.updateOne({ _id: voteID }, {
            "BB.yesVotes": yesVotes,
            "BB.noVotes": noVotes,
            "BB.results.nr_yes": nr_yes,
            "BB.results.nr_no": nr_no,
        });
    } catch (err) {
        return -100;
    }

    return 0;
};

const provisionalTallyQuery = async (voteID) => {
    let result = await doProvisionalTallyQuery(voteID);
    if(result === -100) throw new Error("DatabaseErr")
    else if (result !== 0) throw new Error("provisionalTallyQueryErr");
};

module.exports = provisionalTallyQuery;