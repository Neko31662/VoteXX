const VoteService = require("../services/VoteService");
const JWT = require("../util/JWT");



const VoteController = {
    /**
     * 处理创建投票的请求
     * 创建成功时，res携带对象在数据库中的_id的token
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
            let token = JWT.generate({ _id: result._id }, "vote");
            res.send({
                ActionType: "ok",
                data: {
                    token
                }
            });
        }
    },

    /**
     * 处理加入投票的请求
     */
    join: async (req, res) => {
        let params = {
            ...req.body,
            userID: req.payload._id
        };
        let result = await VoteService.join(params);
        if (result === -1) {
            res.send({ error: "凭证无效" });
        } else if (result === -2) {
            res.send({ error: "投票不存在或已经结束" });
        } else if (result === -3) {
            res.send({ info: "已加入该投票" });
        }
        else if (result === -100) {
            res.send({ error: "数据库错误" });
        }
        else {
            res.send({ ActionType: "ok" });
        }

    },

    /**
     * 统计用户创建的投票数量
     */
    countOwnedVote: async (req, res) => {
        let params = {
            userID: req.payload._id
        };
        let result = await VoteService.countOwnedVote(params);
        if (result === -100) {
            res.send({ error: "数据库错误" });
        }
        else {
            let totalVotes = result;
            res.send({
                ActionType: "ok", data: {
                    totalVotes
                }
            });
        }
    },

    /**
     * 按参数返回用户创建的投票数据
     */
    showOwnedVote: async (req, res) => {
        let params = {
            ...req.query,
            userID: req.payload._id
        };
        let result = await VoteService.showOwnedVote(params);
        if (result === -100) {
            res.send({ error: "数据库错误" });
        } else {
            console.log(result[0]);
            let responseData = [];
            await result.forEach((value, index) => {
                let { _id, voteName, voteIntro, regEndTime, voteEndTime, nulStartTime, nulEndTime, EACount } = value;
                responseData[index] = { _id, voteName, voteIntro, regEndTime, voteEndTime, nulStartTime, nulEndTime, EACount };
            });
            res.send({
                ActionType: "ok",
                data: {
                    responseData
                }
            });
        }
    },

    /**
     * 获取投票凭证
     */
    getVoteToken: async (req, res) => {
        let params = {
            ...req.query,
            owner: req.payload._id
        };
        let exist = VoteService.checkExist(params);
        if (!exist) {
            res.send({
                error: "请求参数错误"
            });
        } else {
            let token = JWT.generate({ _id: params._id }, "vote");
            res.send({
                ActionType: "ok",
                data: {
                    token
                }
            });
        }
    }
};

module.exports = VoteController;