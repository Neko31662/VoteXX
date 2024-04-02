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
     * 已经加入该投票返回-3;
     * 数据库查询时出错返回-100;
     */
    join: async (params) => {
        let valid = JWT.verify(params.joinVoteToken, "vote");
        if (!valid) return -1;

        let voteID = valid._id ? valid._id : "###";
        try {
            let exist = await VoteModel.findById(voteID);
            if (!exist) return -2;
        } catch (err) {
            return -100;
        }

        let userID = params.userID;
        try {
            let joined = await VoteModel.findOne({
                _id: voteID,
                voter: {
                    $in: [userID]
                }
            });
            if (joined) {
                return -3;
            }
        } catch (err) {
            return -100;
        }

        try {
            await VoteModel.updateOne({ _id: voteID }, {
                $push: {
                    voter: userID
                }
            });
        } catch (err) {
            return -100;
        }


        return 0;
    },

    /**
     * 查询用户创建的投票数量
     * @param {*} params 
     * @returns 
     * 成功返回投票数量;
     * 数据库查询时出错返回-100;
     */
    countOwnedVote: async (params) => {
        try {
            let result = await VoteModel.countDocuments({ owner: params.userID });
            return result;
        } catch (err) {
            return -100;
        }
    },

    /**
     * 查询用户参与的投票数量
     * @param {*} params 
     * @returns 
     * 成功返回投票数量;
     * 数据库查询时出错返回-100;
     */
    countJoinedVote: async (params) => {
        try {
            let result = await VoteModel.countDocuments({
                voter: {
                    $in: [params.userID]
                }
            });
            return result;
        } catch (err) {
            console.log(err);
            return -100;
        }
    },

    /**
     * 按条件返回用户创建的投票
     * @param {*} params {page, size}，代表请求的页码数以及每页的显示个数
     * @returns 若干个投票的信息
     */
    showOwnedVote: async (params) => {
        let page = Number(params.page);
        let size = Number(params.size);
        let skipNumber = size * (page - 1);
        try {
            let result = await VoteModel.find({ owner: params.userID }).skip(skipNumber).limit(size);
            return result;
        } catch (err) {
            return -100;
        }
    },

    /**
     * 按条件返回用户参与的投票
     * @param {*} params {page, size}，代表请求的页码数以及每页的显示个数
     * @returns 若干个投票的信息
     */
    showJoinedVote: async (params) => {
        let page = Number(params.page);
        let size = Number(params.size);
        let skipNumber = size * (page - 1);
        try {
            let result = await VoteModel.find({
                voter: {
                    $in: [params.userID]
                }
            }).skip(skipNumber).limit(size);
            return result;
        } catch (err) {
            return -100;
        }
    },

    /**
     * 查询集合内是否存在某一元素，返回布尔值
     */
    checkExist: async (filter) => {
        try {
            var result = await VoteModel.findOne(filter);
        } catch (err) {
            result = null;
        }
        return Boolean(result);
    },

    /**
     * 返回某个特定投票的信息
     * @param {*} params 
     */
    getVoteDetails: async (params) => {
        try {
            let result = await VoteModel.findOne({
                _id: params.voteID,
                voter: params.userID
            });
            if (!result) return -1;
            return result;
        } catch (err) {
            return -100;
        }
    },

};

module.exports = VoteService;
