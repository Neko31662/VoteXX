const mongoose = require("mongoose");
const VoteModel = require("../models/VoteModel");
const shuffleQuery = require("../querys/ShuffleQuery");
const DKGQuery = require("../querys/DKGQuery");

//数据库连接
mongoose.connect("mongodb://127.0.0.1:27017/VoteXX_Database");

//设置定时任务间隔（单位：ms）
const updateVoteStateInterval1 = 60 * 1000;//更新投票状态
const updateVoteStateInterval2 = 20 * 1000;//更新投票状态


//设置定时任务内容
const IntervalTask1 = async () => {
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

};


const IntervalTask2 = async () => {
    let voteInfos = await VoteModel.find({ state: 0 });
    for (let voteInfo of voteInfos) {
        DKGQuery(voteInfo._id).then(() => {
            VoteModel.updateOne({ _id: voteInfo._id }, {
                $set: { state: 1 }
            }).then().catch();
        }).catch((err) => {
            console.log("DKGQueryErr",err);
            // if (err !== "DKGQueryErr") throw err;
        });
    }

    voteInfos = await VoteModel.find({ state: 2 });
    for (let voteInfo of voteInfos) {
        shuffleQuery(voteInfo._id).then(() => {
            VoteModel.updateOne({ _id: voteInfo._id }, {
                $set: { state: 3 }
            }).then().catch();
        }).catch((err) => {
            console.log("shuffleQueryErr",err);
            // throw err;
        });

    }
};


//开启定时任务
setInterval(IntervalTask1, updateVoteStateInterval1);
setInterval(IntervalTask2, updateVoteStateInterval2);
IntervalTask2();