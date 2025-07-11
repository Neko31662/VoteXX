const VoteModel = require("../models/VoteModel");

const { serialize, deserialize } = require("../../crypt/util/Serializer");


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
     * 获取Pedersen公钥
     * @param {{ voteID }} params 
     * 成功返回公钥ck;
     * 未找到投票返回-1;
     * 数据库错误返回-100;
     */
    getCk: async (params) => {
        const { voteID } = params;

        let voteInfo = null;
        try {
            voteInfo = await VoteModel.findOne({ _id: voteID });
        } catch (err) {
            return -100;
        }
        if (!voteInfo) return -1;

        return voteInfo.BB.ck;
    },

    /**
     * 投票步骤的处理
     * @param {{ voteID, signature, enc_pk }} params 
     * 成功返回0;
     * 未找到投票返回-1;
     * 超时返回-2;
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

        let now = new Date();
        if (now >= voteInfo.voteEndTime) return -2;

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
    },

    /**
     * 处理上传弃票信息的请求
     * @param {{ voteID, nullifyYes, flagList, proof }} params
     * 成功返回0;
     * 未找到投票返回-1;
     * 超时返回-2;
     * 数据库错误返回-100;
     */
    nullify: async (params) => {
        const { voteID, nullifyYes, flagList, proof } = params;
        let voteInfo = null;
        try {
            voteInfo = await VoteModel.findOne({ _id: voteID });
        } catch (err) {
            return -100;
        }
        if (!voteInfo) return -1;

        let now = new Date();
        if (now >= voteInfo.nulEndTime) return -2;

        if (nullifyYes) {
            try {
                await VoteModel.updateOne({ _id: voteID }, {
                    $push: {
                        "BB.nullifyYes": {
                            table: flagList,
                            proof
                        }
                    }
                });
            } catch (err) {
                return -100;
            }
        } else {
            try {
                await VoteModel.updateOne({ _id: voteID }, {
                    $push: {
                        "BB.nullifyNo": {
                            table: flagList,
                            proof
                        }
                    }
                });
            } catch (err) {
                return -100;
            }
        }

        return 0;
    }
};

module.exports = VotePrivateService;