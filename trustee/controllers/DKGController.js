const DKGService = require("../services/DKGService");

const DKGController = {

    /**
     * 生成DKG实例，并公开yi与proof
     */
    DKG_step1: async (req, res) => {
        const { voteID } = req.body;
        let result = await DKGService.DKG_step1({ voteID });
        if (result === -1) {
            res.send({ error: "获取投票信息失败" });
        } else if (result === -100) {
            res.send({ error: "数据库错误" });
        }
        else {
            res.send({
                ActionType: "ok",
                data: result
            });
        }
    },

    /**
     * 验证其他人的proof
     */
    DKG_step2: async (req, res) => {
        const { voteID, data } = req.body;
        let result = await DKGService.DKG_step2({ voteID, data });
        if (result === -100) {
            res.send({ error: "数据库错误" });
        }
        else {
            res.send({
                ActionType: "ok",
                data: result
            });
        }
    },

    /**
     * 生成整体公钥
     */
    DKG_step3: async (req, res) => {
        const { voteID, yiList_serialized } = req.body;
        let result = await DKGService.DKG_step3({ voteID, yiList_serialized });
        if (result === -100) {
            res.send({ error: "数据库错误" });
        }
        else {
            res.send({
                ActionType: "ok",
                data: result
            });
        }
    },
};

module.exports = DKGController;