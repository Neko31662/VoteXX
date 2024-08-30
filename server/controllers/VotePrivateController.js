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
            res.send({ error: "Failed to get public key: vote not found" });
        } else if (result === -100) {
            res.send({ error: "Failed to get public key: database error" });
        }
        else {
            res.send({
                ActionType: "ok",
                data: result
            });
        }
    },

    /**
     * 获取Pedersen公钥
     */
    getCk: async (req, res) => {
        let params = {
            voteID: req.query._id,
        };
        let result = await VotePrivateService.getCk(params);

        if (result === -1) {
            res.send({ error: "Failed to get Pedersen public key: vote not found" });
        } else if (result === -100) {
            res.send({ error: "Failed to get Pedersen public key: database error" });
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
            res.send({ error: "Failed to vote: pk not found" });
        } else if (result === -100) {
            res.send({ error: "Failed to vote: database error" });
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
    getProvisionalTallyVotes: async (req, res) => {
        let params = {
            voteID: req.query._id,
        };
        let result = await VotePrivateService.getProvisionalTallyVotes(params);

        if (result === -1) {
            res.send({ error: "Provisional tally failed: vote not found" });
        } else if (result === -100) {
            res.send({ error: "Provisional tally failed: database error" });
        }
        else {
            res.send({
                ActionType: "ok",
                data: result
            });
        }
    },

    /**
     * 处理上传弃票信息的请求
     */
    nullify: async (req, res) => {
        let { voteID, nullifyYes, flagList, proof } = req.body;
        let params = { voteID, nullifyYes, flagList, proof };
        let result = await VotePrivateService.nullify(params);

        if (result === -1) {
            res.send({ error: "Nullification failed: vote not found" });
        } else if (result === -100) {
            res.send({ error: "Nullification failed: database error" });
        }
        else {
            res.send({
                ActionType: "ok",
            });
        }
    }
};


module.exports = VotePrivateController;