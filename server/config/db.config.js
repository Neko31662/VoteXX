const mongoose = require("mongoose");
const VoteModel = require("../models/VoteModel");

//数据库连接
mongoose.connect("mongodb://127.0.0.1:27017/VoteXX_Database");

//设置定时任务间隔（单位：ms）
const updateVoteStateInterval = 60 * 1000;//更新投票状态

//设置定时任务
setInterval(async () => {
    const nowDate = new Date();
    const query = [
        {
            regEndTime: { $lt: nowDate },
            state: 1
        },
        {
            voteEndTime: { $lt: nowDate },
            state: 3
        },
        {
            provisionalTallyFinished: true,
            nulStartTime: { $lt: nowDate },
            state: 4
        },
        {
            nulEndTime: { $lt: nowDate },
            state: 5
        },
    ];
    const update = {
        $inc: { state: 1 }
    };

    for (let i = 0; i < 4; i++) {
        try {
            await VoteModel.updateMany(query[i], update);
        } catch (err) {
            console.log(err);
        }
    }

}, updateVoteStateInterval);