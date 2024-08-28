const BN = require('../primitiv/bn/bn');
let ec = require('../primitiv/ec/ec');
let { MixAndMatch } = require('../protocol/mix_and_match/MixAndMatch');
let { VerifiableShuffle } = require('../protocol/shuffle_argument/ShuffleArgument');
const { PedersenPublicKey, PedersenPublicKey_exec, Commitment_exec } = require('../primitiv/commitment/pedersen_commitment');
const { ElgamalCiphertext_exec, ElgamalEnc } = require('../primitiv/encryption/ElGamal');
const { LiftedElgamalEnc } = require('../primitiv/encryption/LiftedElGamal');
let { PET_data, PET_exec } = require('../protocol/mix_and_match/PET');
const { deserialize, serialize } = require('../util/Serializer');

let chai = require('chai');
let assert = chai.assert;

let players = 2;

describe(`Simulation of Mix and Match protocol, ${players} players`, function () {
    let times = 10;
    let keyPair = ec.genKeyPair();
    let pk = keyPair.getPublic();
    let sk = keyPair.getPrivate();
    let ck = new PedersenPublicKey(ec, 2);

    this.timeout(Math.max(4000, times * players * 500));


    it(`Simulate ${times} times`, () => {
        for (let t = 0; t < times; t++) {
            let bit1 = Math.random() > 0.5 ? 1 : 0;
            let bit2 = Math.random() > 0.5 ? 1 : 0;
            let bit3 = bit1 | bit2;

            let enc_bit1 = LiftedElgamalEnc.encrypt(ec, pk, bit1);
            let enc_bit2 = LiftedElgamalEnc.encrypt(ec, pk, bit2);
            let enc_bit3;

            let shuffled_tables = [];
            let shuffle_proofs = [];

            for (let i = 0; i < players; i++) {
                let lst;
                if (i == 0) {
                    lst = MixAndMatch.generateTruthTable(ec, pk, "or");
                } else {
                    lst = shuffled_tables[i - 1];
                }
                let [tmp1, tmp2] = VerifiableShuffle.shuffleWithProof(ec, pk, ck, lst, 2);

                shuffled_tables[i] = tmp1;
                shuffle_proofs[i] = tmp2;
            }

            for (let i = 0; i < players; i++) {
                let lst;
                if (i == 0) {
                    lst = MixAndMatch.generateTruthTable(ec, pk, "or");
                } else {
                    lst = shuffled_tables[i - 1];
                }
                let cur = shuffled_tables[i];
                assert.isTrue(VerifiableShuffle.verifyProof(ec, pk, ck, lst, cur, shuffle_proofs[i], 2), "Fail to verify shuffle");
            }

            let final_shuffled_table = shuffled_tables[players - 1];

            for (let i = 0; i < 4; i++) {
                let ok = 1;
                for (let j = 0; j < 2; j++) {
                    let PETDatas = [];
                    for (let k = 0; k < players; k++) {
                        PETDatas.push(new PET_data(j === 0 ? enc_bit1 : enc_bit2, final_shuffled_table[i][j]));
                        PET_exec.prepare(ec, ck, PETDatas[k]);
                    }

                    let c_zs = [];
                    let statements = [];
                    let proofs = [];
                    for (let k = 0; k < players; k++) {
                        c_zs[k] = PETDatas[k].statement.c_z;
                        c_zs[k] = deserialize(serialize(c_zs[k]), ec);
                    }
                    for (let k = 0; k < players; k++) {
                        statements[k] = PETDatas[k].statement;
                        statements[k] = deserialize(serialize(statements[k]), ec);
                        statements[k].c_z = c_zs[k];
                    }
                    for (let k = 0; k < players; k++) {
                        proofs[k] = PETDatas[k].proof;
                        proofs[k] = deserialize(serialize(proofs[k]), ec);
                    }

                    for (let k = 0; k < players; k++) {
                        assert.isTrue(PET_exec.verifyProof(ec, ck, statements[k], proofs[k]), "Failed to verify PET proof.");
                    }

                    let new_ctxts = statements.map((value) => value.new_ctxt);
                    for (let k = 0; k < players; k++) {
                        PET_exec.formNewCiphertext(ec, new_ctxts, PETDatas[k]);
                    }

                    let sum_ctxts = PETDatas.map((value) => deserialize(serialize(value.ctxt_sum), ec));
                    for (let k = 0; k < players; k++) {
                        assert.isTrue(ElgamalCiphertext_exec.eq(sum_ctxts[0], sum_ctxts[k]));
                    }

                    let plain = ElgamalEnc.decrypt(ec, sk, sum_ctxts[0]);
                    ok &= plain.isInfinity();
                }
                if (ok) {
                    enc_bit3 = final_shuffled_table[i][2];
                    break;
                }
            }

            let plain_bit3 = LiftedElgamalEnc.decrypt(ec, sk, enc_bit3, 0, 1);
            assert.equal(plain_bit3, bit3, "Not equal to bit3");
        }
    });
});