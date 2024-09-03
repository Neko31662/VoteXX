const axios = require("axios");
const { getAllTrusteeAddress } = require("./methods");
const { serialize, deserialize } = require("../../crypt/util/Serializer");
const { MixAndMatch } = require('../../crypt/protocol/mix_and_match/MixAndMatch');
const { NullificationArgument } = require('../../crypt/protocol/nullification/NullificationArgument');
const { ElgamalCiphertext_exec } = require("../../crypt/primitiv/encryption/ElGamal");
const { shuffleQuery } = require("./ShuffleQuery");
const { PETQuery } = require("./PETQuery");
const { decryptQuery } = require("./DKGQuery");

const VoteModel = require("../models/VoteModel");

const MixAndMatchQuery = async (voteID, voteInfo, ctxt1_serialized, ctxt2_serialized) => {
    const ec = require('../../crypt/primitiv/ec/ec');

    let election_pk = deserialize(voteInfo.BB.election_pk, ec);
    let enc_truthTable = MixAndMatch.generateTruthTable(ec, election_pk, "or");

    let shuffled_truthTable_serialized = await shuffleQuery(voteID, voteInfo.BB.ck, serialize(enc_truthTable));
    let shuffled_truthTable = deserialize(shuffled_truthTable_serialized, ec);

    for (let i = 0; i < 4; i++) {
        let cur = await PETQuery(voteID, serialize(shuffled_truthTable[i][0]), ctxt1_serialized);
        if (!cur) continue;
        cur = await PETQuery(voteID, serialize(shuffled_truthTable[i][1]), ctxt2_serialized);
        if (!cur) continue;

        return serialize(shuffled_truthTable[i][2]);
    }
    throw new Error("MixAndMatchQueryErr");
};

const FinalTallyQuery = async (voteID) => {
    const ec = require('../../crypt/primitiv/ec/ec');

    let voteInfo = null;
    try {
        voteInfo = await VoteModel.findOne({ _id: voteID });
    } catch (err) {
        throw new Error("DatabaseErr");
    }
    let election_pk = deserialize(voteInfo.BB.election_pk, ec);
    let ck = deserialize(voteInfo.BB.ck, ec);

    let cur_list, cur_votes;
    for (let i = 0; i < 2; i++) {
        if (i === 0) {
            cur_list = voteInfo.BB.nullifyYes;
            cur_votes = voteInfo.BB.yesVotes.map(value => deserialize(value, ec));
        } else {
            cur_list = voteInfo.BB.nullifyNo;
            cur_votes = voteInfo.BB.noVotes.map(value => deserialize(value, ec));
        }

        let l = cur_list.length;
        let res = null;
        for (let j = 0; j < l; j++) {
            if (cur_list[j].table.length !== cur_votes.length) continue;
            let table = cur_list[j].table.map(value => deserialize(value, ec));
            let proof = deserialize(cur_list[j].proof, ec);
            if (!NullificationArgument.verifyNullificationProof(ec, election_pk, ck, cur_votes, table, proof)) {
                continue;
            }
            if (!res) {
                res = cur_list[j].table;
            } else {
                for (let k = 0; k < cur_votes.length; k++) {             
                    let tmp = await MixAndMatchQuery(
                        voteID,
                        voteInfo,
                        res[k],
                        cur_list[j].table[k]
                    );
                    res[k] = tmp;
                }
            }
        }
        let plain;
        if (!res) {
            plain = 0;
        } else {
            res = res.map(value => deserialize(value, ec));
            let sum = res.reduce((pre, cur) => ElgamalCiphertext_exec.add(pre, cur));
            plain = await decryptQuery(ec, voteID, serialize(sum), true, 0, res.length);
        }

        try {
            if (i === 0) {
                await VoteModel.updateOne({ _id: voteID }, {
                    "BB.results.nullified_yes": plain,
                });
            } else {
                await VoteModel.updateOne({ _id: voteID }, {
                    "BB.results.nullified_no": plain,
                });
            }

        } catch (err) {
            throw new Error("DatabaseErr");
        }
    }
};

module.exports = FinalTallyQuery;