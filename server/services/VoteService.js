const VoteModel = require("../models/VoteModel");

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
     * 创建成功，返回0
     * 投票参数不合法，返回-1
     * 创建失败，返回-2
     */
    create: async (params) => {
        if (!checkVoteParamsValid(params)) {
            return -1;
        };

        try{
            await VoteModel.create(params);
            return 0;
        }catch(err){
            console.log(err);
            return -2;
        }
        
    }

};

module.exports = VoteService;