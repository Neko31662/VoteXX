const PETService = require("../services/PETService");

const PETController = {

    /**
     * 生成PET实例，并公开c_z
     */
    PET_step1: async (req, res) => {
        const { voteID, ctxt1_serialized, ctxt2_serialized } = req.body;
        let result = await PETService.PET_step1({ voteID, ctxt1_serialized, ctxt2_serialized });
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
     * 生成PET零知识证明
     */
    PET_step2: async (req, res) => {
        const { voteID, ctxt1_serialized, ctxt2_serialized, c_zList_serialized } = req.body;
        let result = await PETService.PET_step2({ voteID, ctxt1_serialized, ctxt2_serialized, c_zList_serialized });
        if (result === -1) {
            res.send({ error: "Failed to obtain election information" });
        } else if (result === -2) {
            res.send({ error: "Can't find PET data for these two ciphertexts" });
        } else if (result === -3) {
            res.send({ error: "Commitment changed" });
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
     * 验证PET零知识证明，验证失败返回false，验证成功返回所有Trustee的new_ctxt的累乘
     */
    PET_step3: async (req, res) => {
        const { voteID, ctxt1_serialized, ctxt2_serialized, statementList, proofList } = req.body;
        let result = await PETService.PET_step3({ voteID, ctxt1_serialized, ctxt2_serialized, statementList, proofList });
        if (result === -1) {
            res.send({ error: "Failed to obtain election information" });
        } else if (result === -2) {
            res.send({ error: "Can't find PET data for these two ciphertexts" });
        } else if (result === -100) {
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

module.exports = PETController;