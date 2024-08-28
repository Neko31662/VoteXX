const BN = require('../../crypt/primitiv/bn/bn');
const ec = require('../../crypt/primitiv/ec/ec');
const { serialize, deserialize } = require('../../crypt/util/Serializer');
const { VerifiableShuffle } = require('../../crypt/protocol/shuffle_argument/ShuffleArgument');

const EAVoteModel = require("../models/EAVoteModel");

/**
 * @typedef {import('../../crypt/primitiv/encryption/ElGamal').ElgamalCiphertext} ElgamalCiphertext
 */

const ShuffleService = {

    shuffle_step1: async (params) => {
        let { voteID, ck_serialized, input_ctxts_serialized, m } = params;
        let voteInfo = null;
        try {
            voteInfo = await EAVoteModel.findOne({ voteID });
        } catch (err) {
            return -100;
        }
        if (!voteInfo) return -1;

        let DKG_instance = deserialize(voteInfo.DKG_instance_serialized, ec);
        let pk = DKG_instance.y;
        let ck = deserialize(ck_serialized, ec);
        let input_ctxts = deserialize(input_ctxts_serialized, ec);
        let [output_ctxts, shuffleProof] = VerifiableShuffle.shuffleWithProof(ec, pk, ck, input_ctxts, m);
        let output_ctxts_serialized = serialize(output_ctxts);
        let shuffleProof_serialized = serialize(shuffleProof);

        return { output_ctxts_serialized, shuffleProof_serialized };
    },

    shuffle_step2: async (params) => {
        let { voteID, data } = params;
        let {
            input_ctxts_serialized,
            ck_serialized,
            shuffled_ctxts_list_serialized,
            shuffleProof_list_serialized,
            EACount,
            m
        } = data;

        let voteInfo = null;
        try {
            voteInfo = await EAVoteModel.findOne({ voteID });
        } catch (err) {
            return -100;
        }
        if (!voteInfo) return -1;

        let DKG_instance = deserialize(voteInfo.DKG_instance_serialized, ec);
        let pk = DKG_instance.y;
        let origin_ctxts = deserialize(input_ctxts_serialized, ec);
        let ck = deserialize(ck_serialized, ec);

        let shuffled_ctxts_list = [];
        for (let i = 0; i < shuffled_ctxts_list_serialized.length; i++) {
            shuffled_ctxts_list[i] = deserialize(shuffled_ctxts_list_serialized[i], ec);
        }

        let shuffleProof_list = [];
        for (let i = 0; i < shuffleProof_list_serialized.length; i++) {
            shuffleProof_list[i] = deserialize(shuffleProof_list_serialized[i], ec);
        }

        let valid = true;
        for (let i = 0; i < EACount; i++) {
            let input_ctxts = i === 0 ? origin_ctxts : shuffled_ctxts_list[i - 1];
            let output_ctxts = shuffled_ctxts_list[i];
            valid &= VerifiableShuffle.verifyProof(ec, pk, ck, input_ctxts, output_ctxts, shuffleProof_list[i], m);
        }

        return Boolean(valid);
    }

};

module.exports = ShuffleService;