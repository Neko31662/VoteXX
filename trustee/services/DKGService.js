const BN = require('../../crypt/primitiv/bn/bn');
const ec = require('../../crypt/primitiv/ec/ec');
const { serialize, deserialize } = require('../../crypt/util/Serializer');
const { DKG, DKG_exec } = require('../../crypt/protocol/DKG/DKG');

const EAVoteModel = require("../models/EAVoteModel");

/**
 * @typedef {import('../../crypt/primitiv/encryption/ElGamal').ElgamalCiphertext} ElgamalCiphertext
 */

const DKGService = {

    /**
     * 生成DKG实例，并公开yi与proof
     * @param {{voteID:String}} params 
     * @returns 
     * 成功返回序列化结果;
     * 获取投票信息失败，返回-1;
     * 数据库错误，返回-100;
     */
    DKG_genKey_step1: async (params) => {
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
        let DKG_instance = new DKG(EACount, seq);
        DKG_exec.generateKey(ec, DKG_instance);
        DKG_exec.generateDKGProof(ec, DKG_instance);

        //序列化
        const DKG_instance_serialized = serialize(DKG_instance);
        const yi_serialized = serialize(DKG_instance.yi);
        const proof_serialized = serialize(DKG_instance.DKGProof);

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
     * @param {{voteID:String,data:{seq:Number,yi_serialized:String,proof_serialized:String}[]}} params 
     * @returns 
     * 验证成功返回计算得到的整体公钥;
     * 验证失败返回false;
     * 数据库错误，返回-100;
     */
    DKG_genKey_step2: async (params) => {
        let { data, voteID } = params;

        let DKG_instance_serialized = null;
        try {
            let voteInfo = await EAVoteModel.findOne({ voteID });
            DKG_instance_serialized = voteInfo.DKG_instance_serialized;
        } catch (err) {
            return -100;
        }
        let DKG_instance = deserialize(DKG_instance_serialized, ec);

        let yiList = [];
        for (let value of data) {
            let { yi_serialized, proof_serialized } = value;
            let yi = deserialize(yi_serialized, ec);
            let proof = deserialize(proof_serialized, ec);
            let res = DKG_exec.verifyDKGProof(ec, yi, proof);
            if (!res) return false;
            yiList.push(yi);
        }
        yiList.push(DKG_instance.yi);

        let result = DKG_exec.calculatePublic(ec, yiList, DKG_instance);

        //保存更新的DKG实例
        DKG_instance_serialized = serialize(DKG_instance);
        try {
            await EAVoteModel.updateOne({ voteID }, { DKG_instance_serialized });
        } catch (err) {
            return -100;
        }

        return serialize(result);
    },

    /**
     * 生成ki和对ki的零知识证明proof
     * @param {{voteID:String,ctxt_serialized:ElgamalCiphertext}} params 
     */
    DKG_decrypt_step1: async (params) => {
        let { voteID, ctxt_serialized } = params;

        let DKG_instance_serialized = null;
        try {
            let voteInfo = await EAVoteModel.findOne({ voteID });
            DKG_instance_serialized = voteInfo.DKG_instance_serialized;
        } catch (err) {
            return -100;
        }
        let DKG_instance = deserialize(DKG_instance_serialized, ec);

        let ctxt = deserialize(ctxt_serialized, ec);
        let [ki, proof] = DKG_exec.decryptOnePartWithProof(ec, DKG_instance, ctxt);
        let ki_serialized = serialize(ki);
        let proof_serialized = serialize(proof);

        //返回要公开的内容
        return { ki_serialized, proof_serialized };
    },

    /**
     * 
     * @param {{
     * voteID:String,
     * data:{
     *     params:{seq:Number,ki_serialized:String,proof_serialized:String}[],
     *     ctxt_serialized:ElgamalCiphertext
     * }
     * }} params 
     */
    DKG_decrypt_step2: async (params) => {
        let { data, voteID } = params;
        let ctxt = deserialize(data.ctxt_serialized, ec);
        data = data.params;

        let DKG_instance_serialized = null;
        try {
            let voteInfo = await EAVoteModel.findOne({ voteID });
            DKG_instance_serialized = voteInfo.DKG_instance_serialized;
        } catch (err) {
            return -100;
        }
        let DKG_instance = deserialize(DKG_instance_serialized, ec);

        for (let value of data) {
            let { ki_serialized, proof_serialized } = value;
            let ki = deserialize(ki_serialized, ec);
            let proof = deserialize(proof_serialized, ec);
            let res = DKG_exec.verifyDecryptProof(ec, DKG_instance, proof, ctxt, ki);
            if (!res) return false;
        }

        return true;
    }
};

module.exports = DKGService;