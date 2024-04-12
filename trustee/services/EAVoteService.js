const { serialize, deserialize } = require("../../crypt/util/CryptoSerializer");
const EAVoteModel = require("../models/EAVoteModel");

const EAVoteService = {
    /**
     * 决定自己是否接受作为该投票trustee的请求
     * @param {{ voteID:String }} params 
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
     * 获取该trustee的私钥
     * @param {{ voteID:String }} params 
     * 成功返回序列化后的私钥;
     * 数据库错误返回-100;
     */
    getPrivateKey: async (params) => {
        const { voteID } = params;

        let voteInfo = null;
        try {
            voteInfo = await EAVoteModel.findOne({ voteID });
        } catch (err) {
            return -100;
        }
        let DKG_instance = deserialize(voteInfo.DKG_instance_serialized);
        let result = serialize(DKG_instance.xi);
        return result;
    }

};

module.exports = EAVoteService;