const VoteService = require("../services/VoteService");



const VoteController = {
    /**
     * 处理创建投票的请求
     */
    create: async (req, res) => {
        let params = {
            ...req.body,
            owner: req.payload._id
        };
        let result = await VoteService.create(params);
        if (result === -1) {
            res.send({ error: "参数合法性校验出错" });
        } else if (result === -2) {
            res.send({ error: "数据库出错" });
        } else {
            res.send({ ActionType: "ok", });
        }
    }
};

module.exports = VoteController;