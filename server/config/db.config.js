const mongoose = require("mongoose");
const VoteModel = require("../models/VoteModel");
const TrusteeModel = require("../models/TrusteeModel");
const md5 = require("md5");
const Chance = require("chance"); //引入随机值产生器库
const { shuffleQuery, shuffleAfterRegQuery } = require("../querys/ShuffleQuery");
const { generateKeyQuery, decryptQuery } = require("../querys/DKGQuery");
const provisionalTallyQuery = require("../querys/ProvisionalTallyQuery");
const FinalTallyQuery = require("../querys/FinalTallyQuery");
const { deserialize, serialize } = require("../../crypt/util/Serializer");
const chance = new Chance();

// 数据库连接
mongoose.connect(
    "mongodb://127.0.0.1:27017/VoteXX_Database"
).then(async () => {  // 将连接逻辑放在async函数中

    // 将数据插入数据库
    for (let i = 1; i <= 5; i++) {
        let username = "trustee" + i;
        let salt = chance.string({ length: 64 });
        let default_password = "neko31662";
        let password = md5(default_password + salt);
        let address = "N/A";

        try {
            // 在插入之前先检查数据库中是否存在该 username
            const existingTrustee = await TrusteeModel.findOne({ username });

            if (!existingTrustee) {
                const result = await TrusteeModel.create({ username, password, salt, address });
                console.log("trustee" + i + " initialization successful!");
            } else {
                console.log("trustee" + i + " already exists, skip initialization");
            }
        } catch (error) {
            console.error("trustee" + i + " initialization failed!", error);
        }
    }

}).catch((error) => {
    console.error("数据库连接失败", error);
});

//设置定时任务间隔（单位：ms）
const updateVoteStateInterval1 = 3 * 1000;//更新投票状态
const updateVoteStateInterval2 = 5 * 1000;//更新投票状态


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
    let voteInfos = await VoteModel.find({ processing: false, state: 0 });
    for (let voteInfo of voteInfos) {
        await VoteModel.updateOne({ _id: voteInfo._id }, {
            $set: { processing: true }
        });
        generateKeyQuery(voteInfo._id).then(() => {
            VoteModel.updateOne({ _id: voteInfo._id }, {
                $set: { state: 1, processing: false }
            }).then().catch();
        }).catch((err) => {
            console.log("DKGQueryErr", err);
            VoteModel.updateOne({ _id: voteInfo._id }, {
                $set: { processing: false }
            }).then().catch();
            // if (err !== "DKGQueryErr") throw err;
        });
    }

    voteInfos = await VoteModel.find({ processing: false, state: 2 });
    for (let voteInfo of voteInfos) {
        await VoteModel.updateOne({ _id: voteInfo._id }, {
            $set: { processing: true }
        });
        shuffleAfterRegQuery(voteInfo._id).then(() => {
            VoteModel.updateOne({ _id: voteInfo._id }, {
                $set: { state: 3, processing: false }
            }).then().catch();
        }).catch((err) => {
            console.log("shuffleAfterRegQueryErr", err);
            VoteModel.updateOne({ _id: voteInfo._id }, {
                $set: { processing: false }
            }).then().catch();
            // throw err;
        });
    }

    voteInfos = await VoteModel.find({ processing: false, state: 4, provisionalTallyFinished: false });
    for (let voteInfo of voteInfos) {
        await VoteModel.updateOne({ _id: voteInfo._id }, {
            $set: { processing: true }
        });
        provisionalTallyQuery(voteInfo._id).then(() => {
            VoteModel.updateOne({ _id: voteInfo._id }, {
                $set: { provisionalTallyFinished: true, processing: false }
            }).then().catch();
        }).catch((err) => {
            console.log("provisionalTallyQueryErr", err);
            VoteModel.updateOne({ _id: voteInfo._id }, {
                $set: { processing: false }
            }).then().catch();
            // throw err;
        });
    }

    voteInfos = await VoteModel.find({ processing: false, state: 6 });
    for (let voteInfo of voteInfos) {
        await VoteModel.updateOne({ _id: voteInfo._id }, {
            $set: { processing: true }
        });
        FinalTallyQuery(voteInfo._id).then(() => {
            VoteModel.updateOne({ _id: voteInfo._id }, {
                $set: { state: 7, processing: false }
            }).then().catch();
        }).catch((err) => {
            console.log("FinalTallyQueryErr", err);
            VoteModel.updateOne({ _id: voteInfo._id }, {
                $set: { processing: false }
            }).then().catch();
            // throw err;
        });
    }
};

VoteModel.updateMany({ processing: true }, { processing: false }).then(() => {
    //开启定时任务
    setInterval(IntervalTask1, updateVoteStateInterval1);
    setInterval(IntervalTask2, updateVoteStateInterval2);
})


// async function test() {
// }
// test();

