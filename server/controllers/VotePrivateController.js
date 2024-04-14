const VotePrivateService = require("../services/VotePrivateService");


const VotePrivateController = {
    /**
     * 获取投票公钥
     */
    getPk: async (req, res) => {
        let params = {
            voteID: req.query._id,
        };
        let result = await VotePrivateService.getPk(params);

        if (result === -1) {
            res.send({ error: "获取公钥失败：未找到投票" });
        } else if (result === -100) {
            res.send({ error: "获取公钥失败：数据库错误" });
        }
        else {
            res.send({
                ActionType: "ok",
                data: result
            });
        }
    },

    /**
     * 投票步骤的处理
     */
    votingStep: async (req, res) => {
        let { voteID, signature, enc_pk } = req.body;
        let params = { voteID, signature, enc_pk };
        let result = await VotePrivateService.votingStep(params);

        if (result === -1) {
            res.send({ error: "投票失败：未找到投票" });
        } else if (result === -100) {
            res.send({ error: "投票失败：数据库错误" });
        }
        else {
            res.send({
                ActionType: "ok",
            });
        }
    },

    /**
     * 获取预先计票后得到的yesVotes和noVotes结果
     */
    getProvisionalTallyVotes:async (req, res) => {
        let params = {
            voteID: req.query._id,
        };
        let result = await VotePrivateService.getProvisionalTallyVotes(params);

        if (result === -1) {
            res.send({ error: "获取预先计票结果失败：未找到投票" });
        } else if (result === -100) {
            res.send({ error: "获取预先计票结果失败：数据库错误" });
        }
        else {
            res.send({
                ActionType: "ok",
                data: result
            });
        }
    }
};


module.exports = VotePrivateController;