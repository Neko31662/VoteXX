const BN = require('bn.js');
const elliptic = require('elliptic');
const EC = elliptic.ec;
const curve = new EC('secp256k1');
const crypto = require('crypto');
var SHA256 = require('crypto-js/sha256');
const { DKG } = require('../../crypt/protocol/DKG/dkg');
const { serialize, deserialize } = require('../../crypt/util/CryptoSerializer');


const EAVoteModel = require("../models/EAVoteModel");

const EAVoteService = {
    /**
     * 决定自己是否接受作为该投票trustee的请求
     * @param {{voteID}} params 
     * 成功接受请求返回结果;
     * 不接受，返回-1;
     * 数据库错误，返回-100;
     */
    joinVote: async (params) => {
        //不接受
        if (false) {
            return -1;
        }

        try {
            let result = await EAVoteModel.create({
                voteID: params.voteID,
                seq: params.seq,
                EACount: params.EACount
            });
            return result;
        } catch (err) {
            return -100;
        }
    },

    /**
     * 
     * @param {*} params 
     * @returns 
     * 成功返回序列化结果;
     * 获取投票信息失败，返回-1;
     * 数据库错误，返回-100;
     */
    DKG_step1: async (params) => {
        //获取投票信息
        const { voteID } = params;
        let voteInfo = null;
        try {
            voteInfo = await EAVoteModel.findOne({ voteID });
        } catch (err) {
            return -100;
        }
        if (!voteInfo) return -1;

        //生成DKG实例
        const { EACount, seq } = voteInfo;
        let DKG_instance = new DKG(EACount, seq, curve);
        DKG_instance.generatePrivate();//生成私钥
        DKG_instance.generateProof();//生成零知识证明


        const DKG_instance_serialized = serialize(DKG_instance);
        const yi_serialized = serialize(DKG_instance.yi);
        const proof_serialized = serialize(DKG_instance.proof);

        await EAVoteModel.updateOne({ voteID }, { DKG_instance_serialized });
        return { yi_serialized, proof_serialized };

    }
};

module.exports = EAVoteService;