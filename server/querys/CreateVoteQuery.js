const axios = require("axios");

const VoteModel = require("../models/VoteModel");
const TrusteeModel = require("../models/TrusteeModel");


/**
 * 向trustee服务进程发出请求，询问能否担任该投票的trustee
 * @param {*} voteInfo 
 * @returns 成功与否的布尔值
 */
const createVoteQuery = async (voteInfo) => {
    let EACount = voteInfo.EACount;
    let i = 0, loc = 0;//目前找到了i个trustee，正在找第loc个trustee
    let success = true;//成功标志
    while (i < EACount) {
        loc++;
        let trusteeInfo = null;

        //依次遍历表中每个trustee账户
        try {
            trusteeInfo = await TrusteeModel.findOne().skip(loc - 1).limit(1);
        } catch (err) {
            return false;
        }

        //如果遍历完整个trustees集合也没找齐，则break
        if (!trusteeInfo) {
            success = false;
            break;
        }

        //询问该trustee是否能负责该投票
        const address = trusteeInfo.address;
        try {
            let res = await axios.post(address + "/ea-vote/join-vote", {
                voteID: voteInfo._id,
                ck:voteInfo.BB.ck,
                seq: i,
                EACount: voteInfo.EACount
            });
            if (res.data.error) continue;
            if (res.data.ActionType !== "ok") {
                continue;
            }
            //若能，将其_id添加至数组
            try {
                await VoteModel.updateOne({ _id: voteInfo._id }, {
                    $push: {
                        trustee: trusteeInfo._id
                    }
                });
                i++;
            } catch (err) {
                continue;
            }
        } catch (err) {
            continue;
        }
    }
    return success;
};

module.exports = createVoteQuery;