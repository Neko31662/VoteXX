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
    },

    /**
     * 投票步骤的处理
     * @param {{ voteID, signature, enc_pk }} params 
     * 成功返回0;
     * 未找到投票返回-1;
     * 数据库错误返回-100;
     */
    votingStep: async (params) => {
        const { voteID, signature, enc_pk } = params;

        let voteInfo = null;
        try {
            voteInfo = await VoteModel.findOne({ _id: voteID });
        } catch (err) {
            return -100;
        }
        if (!voteInfo) return -1;

        try {
            await VoteModel.updateOne({ _id: voteID }, {
                $push: {
                    "BB.votes": { signature, enc_pk }
                }
            });
        } catch (err) {
            return -100;
        }
        return 0;
    },

    /**
     * 获取预先计票后得到的yesVotes和noVotes结果
     * @param {{ voteID }} params 
     * 成功返回yesVotes和noVotes;
     * 未找到投票返回-1;
     * 数据库错误返回-100;
     */
    getProvisionalTallyVotes: async (params) => {
        const { voteID } = params;

        let voteInfo = null;
        try {
            voteInfo = await VoteModel.findOne({ _id: voteID });
        } catch (err) {
            return -100;
        }
        if (!voteInfo) return -1;

        let { yesVotes, noVotes } = voteInfo.BB;
        return { yesVotes, noVotes };
    }
};

module.exports = VotePrivateService;