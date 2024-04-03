const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//限制集合中每个文档的属性以及类型
const VoteType = {
    voteName: {
        required: true,
        type: String,
    },
    voteIntro: {
        required: true,
        type: String,
    },
    regEndTime: {
        required: true,
        type: Date,
    },
    voteEndTime: {
        required: true,
        type: Date,
    },
    nulStartTime: {
        required: true,
        type: Date,
    },
    nulEndTime: {
        required: true,
        type: Date,
    },
    EACount: {
        required: true,
        type: Number,
    },
    owner: {
        required: true,
        type: mongoose.ObjectId,
    },
    voter: {
        required: true,
        type: [mongoose.ObjectId],
        index: true,
        default: [],
    },
    trustee: {
        required: true,
        type: [mongoose.ObjectId],
        default: [],
    },
    /**
     * state的取值代表：
     * 0：注册前准备阶段——计算完成后更新到下一阶段；
     * 1：注册阶段——时间到后更新到下一阶段；
     * 2：投票前准备阶段——计算完成后更新到下一阶段；
     * 3：投票阶段——时间到后更新到下一阶段；
     * 4：初步计票阶段——计算完成且时间到后更新到下一阶段；
     * 5：弃票阶段——时间到后更新到下一阶段；
     * 6：最终统计阶段——计算完成后更新到下一阶段；
     * 7：最终统计阶段完成
     */
    state: {
        required: true,
        type: Number,
        default: 0,
    },
    /**
     * 代表初步计票是否完成
     */
    provisionalTallyFinished:{
        required: true,
        type: Boolean,
        default: false,
    }
};

const VoteModel = mongoose.model("vote", new Schema(VoteType));

module.exports = VoteModel;