const FinalTallyService = require("../services/FinalTallyService.js");

const FinalTallyController = {
    /**
     * 生成投票的FinalTally初始信息
     */
    init: async (req, res) => {
        const { voteID, generatorH } = req.body;
        const params = { voteID, generatorH };
        let result = await FinalTallyService.init(params);
        if (result === -1) {
            res.send({ error: "获取投票信息失败" });
        } else if (result === -100) {
            res.send({ error: "数据库错误" });
        }
        else {
            res.send({
                ActionType: "ok",
            });
        }
    },

    /**
     * 处理mix_and_match请求——第一步
     */
    mixAndMatch_step1: async (req, res) => {
        const { voteID, originCipherDiff } = req.body;
        const params = { voteID, originCipherDiff };
        let result = await FinalTallyService.mixAndMatch_step1(params);

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
     * 处理mix_and_match请求——第二步
     */
    mixAndMatch_step2: async (req, res) => {
        const { voteID, petStatementList, petProofList } = req.body;
        const params = { voteID, petStatementList, petProofList };
        let result = await FinalTallyService.mixAndMatch_step2(params);

        if (result === -1) {
            res.send({ error: "获取投票信息失败" });
        } else if (result === -2) {
            res.send({ error: "信息长度与EA人数不符" });
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
     * 处理mix_and_match请求——第三步
     */
    mixAndMatch_step3: async (req, res) => {
        const { voteID, petRaisedCiphertextList } = req.body;
        const params = { voteID, petRaisedCiphertextList };
        let result = await FinalTallyService.mixAndMatch_step3(params);

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
     * 处理mix_and_match请求——第四步
     */
    mixAndMatch_step4: async (req, res) => {
        const { voteID, decStatementList, decProofList } = req.body;
        const params = { voteID, decStatementList, decProofList };
        let result = await FinalTallyService.mixAndMatch_step4(params);

        if (result === -1) {
            res.send({ error: "获取投票信息失败" });
        } else if (result === -2) {
            res.send({ error: "信息长度与EA人数不符" });
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
     * 处理mix_and_match请求——第五步
     */
    mixAndMatch_step5: async (req, res) => {
        const { voteID, petRaisedCiphertextList, decC1XiList } = req.body;
        const params = { voteID, petRaisedCiphertextList, decC1XiList };
        let result = await FinalTallyService.mixAndMatch_step5(params);

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
};

module.exports = FinalTallyController;