/**
 * 获取一个投票的所有trustee的服务进程的请求地址
 * @param {string} voteID 
 * 成功时返回一个数组;
 * 获取trustee列表失败返回-1;
 * 获取所有trustee地址失败返回-2;
 */
const getAllTrusteeAddress = async (voteID) => {

    const VoteService = require("../services/VoteService");
    const TrusteeService = require("../services/TrusteeService");

    //获取trustee列表
    let trusteeList = await VoteService.getTrusteeList({ voteID });
    if (!Array.isArray(trusteeList)) {
        return -1;
    }

    //根据trustee列表获取trustee地址
    let getAddressPromises = [];
    for (let val of trusteeList) {
        getAddressPromises.push(TrusteeService.getAddress({ userID: val }));
    }

    let result = [];
    try {
        result = await Promise.all(getAddressPromises);
    } catch (err) {
        return -2;
    }

    for (let val of result) {
        if (typeof val !== "string") return -2;
    }

    return result;
};

module.exports = {
    getAllTrusteeAddress,
};