const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EAVoteType = {
    voteID:{
        required: true,
        type: mongoose.ObjectId,
    },
}

const EAVoteModel = mongoose.model("EAvote", new Schema(EAVoteType));

module.exports = EAVoteModel;