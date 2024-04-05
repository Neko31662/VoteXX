const VoteService = require("../services/VoteService");
const JWT = require("../util/JWT");

const generateVoteToken = (params) => {
    return JWT.generate(params, "vote");
};

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
            res.send({ error: "资源不足，请尝试减少trustee数量或稍后再创建投票" });
        } else if (result === -100) {
            res.send({ error: "数据库错误" });
        } else {
            let token = generateVoteToken({ _id: result._id });
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
     * 统计用户加入的投票数量
     */
    countJoinedVote: async (req, res) => {
        let params = {
            userID: req.payload._id
        };
        let result = await VoteService.countJoinedVote(params);
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
     * 按参数返回用户参加的投票数据
     */
    showJoinedVote: async (req, res) => {
        let params = {
            ...req.query,
            userID: req.payload._id
        };
        let result = await VoteService.showJoinedVote(params);
        if (result === -100) {
            res.send({ error: "数据库错误" });
        } else {
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
            let token = generateVoteToken({ _id: params._id });
            res.send({
                ActionType: "ok",
                data: {
                    token
                }
            });
        }
    },

    /**
     * 获得一个特定投票的详细信息
     */
    getVoteDetails: async (req, res) => {
        let params = {
            voteID: req.query._id,
            userID: req.payload._id
        };
        let result = await VoteService.getVoteDetails(params);
        if (result === -1) {
            res.send({ error: "未找到投票" });
        } else if (result === -100) {
            res.send({ error: "数据库错误" });
        } else {
            let responseData = [];
            let { _id, voteName, voteIntro, regEndTime, voteEndTime, nulStartTime, nulEndTime, EACount, state } = result;
            responseData = { _id, voteName, voteIntro, regEndTime, voteEndTime, nulStartTime, nulEndTime, EACount, state };
            res.send({
                ActionType: "ok",
                data: {
                    responseData
                }
            });
        }
    }
};

module.exports = VoteController;