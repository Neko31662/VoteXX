const VotePrivateService = require("../services/VotePrivateService");


const VotePrivateController = {
    /**
     * 获取公钥
     */
    getPk: async (req, res) => {
        let params = {
            voteID: req.query._id,
            userID: req.payload._id
        };
        let result = await VotePrivateService.getPk(params);
        if (result === -1) {
            res.send({ error: "未加入投票" });
        } else if (result === -100) {
            res.send({ error: "数据库错误" });
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