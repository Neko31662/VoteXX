const ShuffleService = require("../services/ShuffleService");

const ShuffleController = {

    /**
     * 进行混洗并生成零知识证明
     */
    shuffle_step1: async (req, res) => {
        const { voteID, ck_serialized, input_ctxts_serialized, m } = req.body;
        let result = await ShuffleService.shuffle_step1({ voteID, ck_serialized, input_ctxts_serialized, m });
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

    shuffle_step2: async (req, res) => {
        const { voteID, data } = req.body;
        let result = await ShuffleService.shuffle_step2({ voteID, data });
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
    }
};

module.exports = ShuffleController;