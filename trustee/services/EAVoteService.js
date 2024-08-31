const { serialize, deserialize } = require("../../crypt/util/Serializer");
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
                ck: params.ck,
                seq: params.seq,
                EACount: params.EACount
            });
            return result;
        } catch (err) {
            return -100;
        }
    },

};

module.exports = EAVoteService;