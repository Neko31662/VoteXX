const BN = require('bn.js');
const elliptic = require('elliptic');
const EC = elliptic.ec;
const curve = new EC('secp256k1');
const crypto = require('crypto');
var SHA256 = require('crypto-js/sha256');
const { DKG } = require('../../crypt/protocol/DKG/dkg');
const { serialize, deserialize } = require('../../crypt/util/CryptoSerializer');


const EAVoteModel = require("../models/EAVoteModel");

const DKGService = {

    /**
     * 生成DKG实例，并公开yi与proof
     * @param {{voteID:String}} params 
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

        //序列化
        const DKG_instance_serialized = serialize(DKG_instance);
        const yi_serialized = serialize(DKG_instance.yi);
        const proof_serialized = serialize(DKG_instance.proof);

        //保存DKG实例
        try {
            await EAVoteModel.updateOne({ voteID }, { DKG_instance_serialized });
        } catch (err) {
            return -100;
        }

        //返回要公开的内容
        return { yi_serialized, proof_serialized };
    },

    /**
     * 验证其他人的proof
     * @param {{voteID:String,data:Array<{seq:Number,yi_serialized:String,proof_serialized:String}>}} params 
     * @returns 
     * 验证成功返回true;
     * 验证失败返回false;
     * 数据库错误，返回-100;
     */
    DKG_step2: async (params) => {
        let { data, voteID } = params;

        let DKG_instance_serialized = null;
        try {
            let voteInfo = await EAVoteModel.findOne({ voteID });
            DKG_instance_serialized = voteInfo.DKG_instance_serialized;
        } catch (err) {
            return -100;
        }
        let DKG_instance = deserialize(DKG_instance_serialized);

        for (let value of data) {
            let { yi_serialized, proof_serialized } = value;
            let yi = deserialize(yi_serialized);
            let proof = deserialize(proof_serialized);
            let res = DKG_instance.verifyProof(yi, proof);
            if (!res) return false;
        }
        return true;
    },

    /**
     * 生成整体公钥
     * @param {{voteID:String,yiList_serialized:Array<String>}} params 
     * @returns 
     * 验证成功返回true;
     * 验证失败返回false;
     * 数据库错误，返回-100;
     */
    DKG_step3: async (params) => {
        const { voteID, yiList_serialized } = params;

        //获取DKG实例
        let DKG_instance_serialized = null;
        try {
            let voteInfo = await EAVoteModel.findOne({ voteID });
            DKG_instance_serialized = voteInfo.DKG_instance_serialized;
        } catch (err) {
            return -100;
        }
        let DKG_instance = deserialize(DKG_instance_serialized);

        //计算整体公钥
        let yiList = [];
        for (let i in yiList_serialized) {
            yiList[i] = deserialize(yiList_serialized[i]);
        }
        let result = DKG_instance.DKG_getPublic(yiList);

        //保存更新的DKG实例
        DKG_instance_serialized = serialize(DKG_instance);
        try {
            await EAVoteModel.updateOne({ voteID }, { DKG_instance_serialized });
        } catch (err) {
            return -100;
        }

        return serialize(result);
    }
};

module.exports = DKGService;