const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EC = require('elliptic').ec;
const curve = new EC('secp256k1');
const BN = require('bn.js');

const { generateRandomNumber } = require('../../crypt/protocol/DKG/dkg');
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
    pk: {
        required: true,
        type: String,
        default: " "
    },
    pks: {
        required: true,
        type: [{ enc_pk_yes: String, enc_pk_no: String }],
        default: []
    }
};

const BBSchema = new Schema(BBType);

module.exports = BBSchema;