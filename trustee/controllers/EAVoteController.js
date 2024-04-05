const EAVoteService = require("../services/EAVoteService");

const EAVoteController = {

    /**
     * 服务器通过该api请求该trustee作为EA的成员加入某一投票
     */
    joinVote: async (req, res) => {
        const { voteID, seq, EACount } = req.body;

        let result = await EAVoteService.joinVote({ voteID, seq, EACount });
        if (result === -1) {
            res.send({ ActionType: "refuse" });
        } else if (result === -100) {
            res.send({ error: "数据库错误" });
        }
        else {
            res.send({ ActionType: "ok" });
        }

    },

    DKG_step1: async (req, res) => {
        const { voteID } = req.body;
        let result = await EAVoteService.DKG_step1({ voteID });
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
    }
};

module.exports = EAVoteController;