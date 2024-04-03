const EAVoteService = require("../services/EAVoteService");

const EAVoteController = {

    /**
     * 服务器通过该api请求该trustee作为EA的成员加入某一投票
     */
    joinVote: async (req, res) => {
        const voteID = req.body.voteID;

        let result = await EAVoteService.joinVote({voteID});
        if(result === -1){
            res.send({ ActionType: "refuse" });
        }else if(result === -100){
            res.send({ error: "数据库错误" });
        }
        else{
            res.send({ ActionType: "ok" });
        }
        
    }
};

module.exports = EAVoteController;