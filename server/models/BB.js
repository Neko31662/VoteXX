const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EC = require('elliptic').ec;
const curve = new EC('secp256k1');
const BN = require('bn.js');

const { serialize } = require("../../crypt/util/CryptoSerializer");

const BBType = {
    generatorH: {
        required: true,
        type: String,
        default: serialize(curve.g.mul(generateRandomNumber(curve)))
    },
    yiList: {
        required: true,
        type: [String],
        default: []
    },
    election_pk: {
        required: true,
        type: String,
        default: " "
    },
    pks: {
        required: true,
        type: [{ enc_pk_yes: String, enc_pk_no: String }],
        default: []
    },
    shuffled_plain_pks: {
        required: true,
        type: [{ pk_yes: String, pk_no: String }],
        default: []
    },
    votes: {
        required: true,
        type: [{ enc_pk: String, signature: String }],
        default: []
    },
    results: {
        required: true,
        type: {
            nr_yes: Number,
            nr_no: Number,
            nullified_yes: Number,
            nullified_no: Number,
        },
        default: {
            nr_yes: 0,
            nr_no: 0,
            nullified_yes: 0,
            nullified_no: 0,
        }
    },
    yesVotes: {
        required: true,
        type: [String],
        default: []
    },
    noVotes: {
        required: true,
        type: [String],
        default: []
    },
    nullifyYes: {
        required: true,
        type: [{
            table: [String],
            proof: String,
        }],
        default: [],
    },
    nullifyNo: {
        required: true,
        type: [{
            table: [String],
            proof: String,
        }],
        default: [],
    }
};

const BBSchema = new Schema(BBType);

module.exports = BBSchema;