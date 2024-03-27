const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//限制集合中每个文档的属性以及类型
const VoteType = {
    voteName:{
        required:true,
        type: String,
    },
    voteIntro:{
        required:true,
        type: String,
    },
    regEndTime: {
        required:true,
        type: Date,
    },
    voteEndTime: {
        required:true,
        type: Date,
    },
    nulStartTime: {
        required:true,
        type: Date,
    },
    nulEndTime: {
        required:true,
        type: Date,
    },
    EACount:{
        required:true,
        type: Number,
    },
    owner:{
        required:true,
        type:mongoose.ObjectId,
    },
    voter:{
        required:true,
        type:[mongoose.ObjectId],
        index:true,
        default:[],
    }
};

const VoteModel = mongoose.model("vote", new Schema(VoteType));

module.exports = VoteModel;