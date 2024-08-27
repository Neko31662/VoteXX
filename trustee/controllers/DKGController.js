const DKGService = require("../services/DKGService");

const DKGController = {

    /**
     * 生成DKG实例，并公开yi与proof
     */
    DKG_genKey_step1: async (req, res) => {
        const { voteID } = req.body;
        let result = await DKGService.DKG_genKey_step1({ voteID });
        if (result === -1) {
            res.send({ error: "Failed to obtain election information" });
        } else if (result === -100) {
            res.send({ error: "Database error" });
        }
        else {
            res.send({
                ActionType: "ok",
                data: result
            });
        }
    },

    /**
     * 验证其他人的proof，成功直接返回生成的整体公钥
     */
    DKG_genKey_step2: async (req, res) => {
        const { voteID, data } = req.body;
        let result = await DKGService.DKG_genKey_step2({ voteID, data });
        if (result === -100) {
            res.send({ error: "Database error" });
        }
        else {
            res.send({
                ActionType: "ok",
                data: result
            });
        }
    },

    /**
     * 分布式解密，用自己的私钥碎片解密并提供零知识证明
     */
    DKG_decrypt_step1: async (req, res) => {
        const { voteID, ctxt_serialized } = req.body;
        let result = await DKGService.DKG_decrypt_step1({ voteID, ctxt_serialized });
        if (result === -100) {
            res.send({ error: "Database error" });
        }
        else {
            res.send({
                ActionType: "ok",
                data: result
            });
        }
    },

    /**
     * 分布式解密，验证他人的零知识证明
     */
    DKG_decrypt_step2: async (req, res) => {
        const { voteID, data } = req.body;
        let result = await DKGService.DKG_decrypt_step2({ voteID, data });
        if (result === -100) {
            res.send({ error: "Database error" });
        }
        else {
            res.send({
                ActionType: "ok",
                data: result
            });
        }
    }
};

module.exports = DKGController;