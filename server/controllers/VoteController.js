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
            res.send({ error: "Parameter validity check error" });
        } else if (result === -2) {
            res.send({ error: "Insufficient resources, please try to reduce the number of trustees or create a vote later." });
        } else if (result === -100) {
            res.send({ error: "Database error" });
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
            res.send({ error: "Invalid token" });
        } else if (result === -2) {
            res.send({ error: "Election does not exist or has ended" });
        } else if (result === -3) {
            res.send({ info: "Already joined the election" });
        }
        else if (result === -100) {
            res.send({ error: "Database error" });
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
            res.send({ error: "Database error" });
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
            res.send({ error: "Database error" });
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
            res.send({ error: "Database error" });
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
            res.send({ error: "Database error" });
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
                error: "Request parameter error"
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
            res.send({ error: "Vote not found" });
        } else if (result === -100) {
            res.send({ error: "Database error" });
        } else {
            let responseData = [];
            let { _id, voteName, voteIntro, regEndTime, voteEndTime, nulStartTime, nulEndTime, EACount, state } = result;
            let results = result.BB.results;
            responseData = { _id, voteName, voteIntro, regEndTime, voteEndTime, nulStartTime, nulEndTime, EACount, state, results };
            res.send({
                ActionType: "ok",
                data: responseData
            });
        }
    },

    /**
     * 投票的注册阶段
     */
    registrationStep: async (req, res) => {
        let { voteID, enc_pk_yes, enc_pk_no } = req.body;
        let userID = req.payload._id;
        let params = { voteID, userID, enc_pk_yes, enc_pk_no };

        let result = await VoteService.registrationStep(params);
        if (result === -1) {
            res.send({ error: "Already registered in this election" });
        } else if (result === -2) {
            res.send({ error: "Did not join this election" });
        } else if (result === -100) {
            res.send({ error: "Database error" });
        }
        else {
            res.send({ ActionType: "ok" });
        }
    },


};

module.exports = VoteController;