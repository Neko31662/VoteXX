const VoteModel = require("../models/VoteModel");
const JWT = require("../util/JWT");
const createVoteQuery = require("../querys/CreateVoteQuery");
const DKGQuery = require("../querys/DKGQuery");
const tryUntilSuccess = require("../util/TryUntilSuccess");

const { serialize, deserialize } = require("../../crypt/util/CryptoSerializer");

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
     * 由于trustee不足创建失败，返回-2;
     * 数据库错误返回-100;
     */
    create: async (params) => {
        //检查投票参数合法性
        if (!checkVoteParamsValid(params)) {
            return -1;
        };

        //在数据库中创建投票
        try {
            var result = await VoteModel.create(params);
        } catch (err) {
            console.log(err);
            return -100;
        }

        let success = await createVoteQuery(result);
        if (!success) {
            try {
                await VoteModel.deleteOne({ _id: result._id });
            } catch (err) {
            }
            return -2;
        }

        tryUntilSuccess(DKGQuery, 20000, "DKGQueryErr", result._id)
            .then(() => {
                VoteModel.updateOne({ _id: result._id }, {
                    state: 1
                }).catch((err) => {
                    console.log("<ERROR> DKGQueryUpdateErr:", err);
                });
            })
            .catch((err) => {
                console.log("<ERROR> DKGQueryErr:", err);
            });

        return result;
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
            result = false;
        }
        return Boolean(result);
    },

    /**
     * 返回某个特定投票的信息
     * @param {*} params 
     * 成功时返回该信息;
     * 未找到返回-1;
     * 数据库错误返回-100;
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

    /**
     * 获得该投票的EA名单
     * @param {{voteID:String}} params
     * 成功时返回该信息;
     * 未找到返回-1;
     * trustee列表长度与记录数量不匹配返回-2;
     * 数据库错误返回-100; 
     */
    getTrusteeList: async (params) => {
        if (!params.voteID) return -1;

        let voteInfo = {};
        try {
            voteInfo = await VoteModel.findOne({ _id: params.voteID });
        } catch (err) {
            return -100;
        }
        if (!voteInfo) return -1;

        let { EACount, trustee } = voteInfo;
        if (trustee.length != EACount) return -2;
        return trustee;
    },

    /**
     * 投票的注册阶段
     * @param {{ voteID, userID, enc_pk_yes, enc_pk_no }} params 
     * 已注册返回-1;
     * 未加入投票返回-2;
     * 数据库错误返回-100;
     */
    registrationStep: async (params) => {
        let { voteID, userID, enc_pk_yes, enc_pk_no } = params;

        try {
            let registered = await VoteModel.exists({ _id: voteID, voter_registered: userID });
            if (registered) return -1;
        } catch {
            return -100;
        }

        try {
            let joined = await VoteModel.exists({ _id: voteID, voter: userID });
            if (!joined) return -2;
        } catch {
            return -100;
        }


        try {
            await VoteModel.updateOne({ _id: voteID }, {
                $push: {
                    voter_registered: userID,
                    "BB.pks": { enc_pk_yes, enc_pk_no }
                }
            });
        } catch (err) {
            console.log(err);
            return -100;
        }
        return 0;

    },

    

};

module.exports = VoteService;
