const BN = require('../../crypt/primitiv/bn/bn');
const ec = require('../../crypt/primitiv/ec/ec');
const { serialize, deserialize } = require('../../crypt/util/Serializer');
const { ElgamalCiphertext_exec } = require('../../crypt/primitiv/encryption/ElGamal');
const { PET_data, PET_exec } = require('../../crypt/protocol/mix_and_match/PET');

const EAVoteModel = require("../models/EAVoteModel");

const PET_data_map = new Map();
const commitment_map = new Map();

const PETService = {
    PET_step1: async (params) => {
        let { voteID, ctxt1_serialized, ctxt2_serialized } = params;
        let hash = ctxt1_serialized + ctxt2_serialized;

        //获取投票信息
        let voteInfo = null;
        try {
            voteInfo = await EAVoteModel.findOne({ voteID });
        } catch (err) {
            return -100;
        }
        if (!voteInfo) return -1;

        let { ck } = voteInfo;
        ck = deserialize(ck, ec);

        let ctxt1 = deserialize(ctxt1_serialized, ec);
        let ctxt2 = deserialize(ctxt2_serialized, ec);
        let PETData = new PET_data(ctxt1, ctxt2);
        PET_exec.prepare(ec, ck, PETData);
        PET_data_map.set(hash, PETData);

        return serialize(PETData.statement.c_z);
    },

    PET_step2: async (params) => {
        let { voteID, ctxt1_serialized, ctxt2_serialized, c_zList_serialized } = params;
        let hash = ctxt1_serialized + ctxt2_serialized;

        //获取投票信息
        let voteInfo = null;
        try {
            voteInfo = await EAVoteModel.findOne({ voteID });
        } catch (err) {
            return -100;
        }
        if (!voteInfo) return -1;

        if (!PET_data_map.has(hash)) return -2;
        let PETData = PET_data_map.get(hash);

        let { ck, seq } = voteInfo;
        ck = deserialize(ck, ec);

        let c_z_serialized = serialize(PETData.statement.c_z);
        if (c_zList_serialized[seq] !== c_z_serialized) return -3;
        commitment_map.set(hash, c_zList_serialized.map(value => deserialize(value, ec)));

        return {
            statement: serialize(PETData.statement),
            proof: serialize(PETData.proof)
        };
    },

    PET_step3: async (params) => {
        let { voteID, ctxt1_serialized, ctxt2_serialized, statementList, proofList } = params;
        let hash = ctxt1_serialized + ctxt2_serialized;

        if (!PET_data_map.has(hash)) {
            commitment_map.delete(hash);
            return -2;
        }
        let PETData = PET_data_map.get(hash);
        PET_data_map.delete(hash);

        if (!commitment_map.has(hash)) return -2;
        let commitments = commitment_map.get(hash);
        commitment_map.delete(hash);

        //获取投票信息
        let voteInfo = null;
        try {
            voteInfo = await EAVoteModel.findOne({ voteID });
        } catch (err) {
            return -100;
        }
        if (!voteInfo) return -1;

        let { ck, seq, EACount } = voteInfo;
        ck = deserialize(ck, ec);

        statementList = statementList.map(value => deserialize(value, ec));
        proofList = proofList.map(value => deserialize(value, ec));
        let ctxt_sum = ElgamalCiphertext_exec.identity(ec);
        for (let i = 0; i < EACount; i++) {
            if (i === seq) continue;
            statementList[i].c_z = commitments[i];
            let valid = PET_exec.verifyProof(ec, ck, statementList[i], proofList[i]);
            if (!valid) return false;
            ctxt_sum = ElgamalCiphertext_exec.add(ctxt_sum, statementList[i].new_ctxt);
        }
        ctxt_sum = ElgamalCiphertext_exec.add(ctxt_sum, PETData.statement.new_ctxt);

        return serialize(ctxt_sum);
    }
};

module.exports = PETService;