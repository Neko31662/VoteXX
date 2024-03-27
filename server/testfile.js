const mongoose = require("mongoose");
const VoteModel = require("./models/VoteModel");

mongoose.connect("mongodb://127.0.0.1:27017/VoteXX_Database");

const main = async () => {
    await VoteModel.updateOne({ voteName: '7' }, {
        $push:{
            voter: "65fb04313f74426b3b4e3fc6"
        }
    });
    console.log("ok");
};

main();


