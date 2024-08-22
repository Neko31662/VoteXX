const BN = require('../primitiv/bn/bn');
let ec = require('../primitiv/ec/ec');
const { ElgamalCiphertext_exec, ElgamalEnc } = require('../primitiv/encryption/ElGamal');
const { PedersenPublicKey, PedersenPublicKey_exec, Commitment_exec } = require('../primitiv/commitment/pedersen_commitment');
const { serialize, deserialize } = require('../util/Serializer');
const { PETArgument, PETStatement, PETWitness, PET_data, PET_exec } = require('../protocol/mix_and_match/PET');

let chai = require('chai');
let assert = chai.assert;

describe(`Test of 'PET.js'`, function () {
    let msg = ec.randomPoint();
    let keyPair = ec.genKeyPair();
    let pk = keyPair.getPublic();
    let sk = keyPair.getPrivate();
    let ck = new PedersenPublicKey(ec, 2);
    let n = 5;

    describe(`Test of 'PETArgument'`, function () {
        let global = {};
        let old_ctxt = ElgamalEnc.encrypt(ec, pk, msg);
        let z = ec.randomBN();
        let new_ctxt = ElgamalCiphertext_exec.mul(old_ctxt, z);
        let [c_z, r] = PedersenPublicKey_exec.commit(ec, ck, z);

        let statement = new PETStatement(c_z, old_ctxt, new_ctxt);
        let witness = new PETWitness(z, r);

        global.statement = statement;
        global.witness = witness;

        it("Test of 'PETArgument.generateProof'", () => {
            global.proof = PETArgument.generateProof(ec, ck, statement, witness);
        });

        it("Test of 'PETArgument.verifyProof'", () => {
            assert.isTrue(PETArgument.verifyProof(ec, ck, statement, global.proof));
        });
    });

    describe(`Test of 'PET_exec', ${n} players`, function () {
        let ctxt1 = ElgamalEnc.encrypt(ec, pk, msg);
        let ctxt2 = ElgamalEnc.encrypt(ec, pk, msg);
        let ctxt3 = ElgamalEnc.encrypt(ec, pk, ec.randomPoint());

        it("When ctxt1 and ctxt2 correspond to the same plaintext", () => {
            let PETData = [];
            let statementList = [];
            let proofList = [];
            let ctxt_list = [];
            for (let i = 0; i < n; i++) {
                PETData[i] = new PET_data(ctxt1, ctxt2);
                PET_exec.calDifference(PETData[i]);
                PET_exec.raiseToExponentAndProof(ec, ck, PETData[i]);

                statementList[i] = PETData[i].statement;
                proofList[i] = PETData[i].proof;
                ctxt_list[i] = PETData[i].statement.new_ctxt;
            }
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    if (i == j) continue;
                    assert.isTrue(PET_exec.verifyProof(ec, ck, statementList[i], proofList[i]));
                }
            }
            for (let i = 0; i < n; i++) {
                PET_exec.formNewCiphertext(ec, ctxt_list, PETData[i]);
                let p = ElgamalEnc.decrypt(ec, sk, PETData[i].ctxt_sum);
                assert.isTrue(p.isInfinity());
            }
        });

        it("When ctxt1 and ctxt2 correspond to the different plaintext", () => {
            let PETData = [];
            let statementList = [];
            let proofList = [];
            let ctxt_list = [];
            for (let i = 0; i < n; i++) {
                PETData[i] = new PET_data(ctxt1, ctxt3);
                PET_exec.calDifference(PETData[i]);
                PET_exec.raiseToExponentAndProof(ec, ck, PETData[i]);

                statementList[i] = PETData[i].statement;
                proofList[i] = PETData[i].proof;
                ctxt_list[i] = PETData[i].statement.new_ctxt;
            }
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    if (i == j) continue;
                    assert.isTrue(PET_exec.verifyProof(ec, ck, statementList[i], proofList[i]));
                }
            }
            for (let i = 0; i < n; i++) {
                PET_exec.formNewCiphertext(ec, ctxt_list, PETData[i]);
                let p = ElgamalEnc.decrypt(ec, sk, PETData[i].ctxt_sum);
                assert.isFalse(p.isInfinity());
            }
        });

        it("Test of serialization", () => {
            let PETData = [];
            let statementList = [];
            let proofList = [];
            let ctxt_list = [];
            for (let i = 0; i < n; i++) {
                PETData[i] = new PET_data(ctxt1, ctxt2);
                PET_exec.calDifference(PETData[i]);
                PET_exec.raiseToExponentAndProof(ec, ck, PETData[i]);

                statementList[i] = deserialize(serialize(PETData[i].statement), ec);
                proofList[i] = deserialize(serialize(PETData[i].proof), ec);
                ctxt_list[i] = deserialize(serialize(PETData[i].statement.new_ctxt), ec);
            }
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    if (i == j) continue;
                    assert.isTrue(PET_exec.verifyProof(ec, ck, statementList[i], proofList[i]));
                }
            }
            for (let i = 0; i < n; i++) {
                PET_exec.formNewCiphertext(ec, ctxt_list, PETData[i]);
                let p = ElgamalEnc.decrypt(ec, sk, PETData[i].ctxt_sum);
                assert.isTrue(p.isInfinity());
            }
        });
    });
});
