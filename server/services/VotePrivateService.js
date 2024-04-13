const VoteModel = require("../models/VoteModel");

const { serialize, deserialize } = require("../../crypt/util/CryptoSerializer");


const VotePrivateService = {
    /**
         * 获取公钥
         * @param {{ voteID }} params 
         * 成功返回公钥pk;
         * 未找到投票返回-1;
         * 数据库错误返回-100;
         */
    getPk: async (params) => {
        const { voteID } = params;

        let voteInfo = null;
        try {
            voteInfo = await VoteModel.findOne({ _id: voteID });
        } catch (err) {
            return -100;
        }
        if (!voteInfo) return -1;

        return voteInfo.BB.election_pk;
    }
};

module.exports = VotePrivateService;