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
            let token = JWT.generate({_id:result._id});
            res.send({ 
                ActionType: "ok",
                data:{
                    token
                }
            });
        }
    },

    /**
     * 处理加入投票的请求
     */
    join: async(req,res)=>{
        let params = {
            ...req.body,
            userID: req.payload._id
        };
        let result = await VoteService.join(params);
        if(result === -1){
            res.send({ error: "凭证无效" });
        }else if(result === -2){
            res.send({ error: "投票不存在或已经结束" });
        }else{
            res.send({ActionType:"ok"});
        }
        
    }
};

module.exports = VoteController;