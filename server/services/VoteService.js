const VoteModel = require("../models/VoteModel");
const JWT = require("../util/JWT");

/**
 * 验证创建投票数据的合法性，返回布尔值
 */
const checkVoteParamsValid = ({
    voteName,
    voteIntro,
    regEndTime,
    voteEndTime,
    nulStartTime,
    nulEndTime,
    EACount
}) => {

    //验证时间格式
    const times = [regEndTime, voteEndTime, nulStartTime, nulEndTime];
    try {
        times.forEach((value, index) => {
            times[index] = new Date(value);
        });
    } catch (error) {
        return false;
    }

    //验证文本及长度
    if (!voteName || voteName.length > 100) return false;
    if (!voteIntro || voteIntro.length > 500) return false;

    //验证时间关系
    if (!times[0] instanceof Date || times[0] <= new Date()) return false;
    for (let i = 1; i < 4; i++) {
        if (!times[i] instanceof Date || times[i] <= times[i - 1]) return false;
    }

    //验证EA人数
    if (typeof (EACount) !== "number" || EACount < 2 || EACount > 5) return false;
    return true;
};



const VoteService = {
    /**
     * 创建投票
     * @param {*} params 投票参数的集合
     * @returns 
     * 创建成功，返回投票结构体;
     * 投票参数不合法，返回-1;
     * 创建失败，返回-2;
     */
    create: async (params) => {
        if (!checkVoteParamsValid(params)) {
            return -1;
        };

        try {
            let result = await VoteModel.create(params);
            return result;
        } catch (err) {
            console.log(err);
            return -2;
        }

    },

    /**
     * 加入投票
     * @param {*} params {joinVoteToken: 加入投票的凭证, userID: 用户在数据库中的“_id”值}
     * @returns 
     * 成功返回相关信息;
     * joinVoteToken验证失败返回-1;
     * joinVoteToken验证成功，但数据库中未查询到该投票返回-2;
     */
    join: async (params) => {
        let valid = JWT.verify(params.joinVoteToken);
        if (!valid) return -1;

        let voteID = valid._id ? valid._id : "###";
        try {
            let exist = await VoteModel.findById(voteID);
            console.log(exist);
            if (!exist) return -2;
        } catch (err) {
            return -2;
        }

        return 0;
    }

};

module.exports = VoteService;
