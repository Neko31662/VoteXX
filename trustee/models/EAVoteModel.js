const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EAVoteType = {
    voteID: {
        required: true,
        type: mongoose.ObjectId,
    },
    EACount: {
        required: true,
        type: Number,
    },
    /**
     * 该trustee在该投票中的序号
     */
    seq: {
        required: true,
        type: Number,
    },
    DKG_instance_serialized: {
        type: String
    }
};

const EAVoteModel = mongoose.model("EAvote", new Schema(EAVoteType));

module.exports = EAVoteModel;