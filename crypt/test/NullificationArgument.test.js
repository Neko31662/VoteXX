const BN = require('../primitiv/bn/bn');
let ec = require('../primitiv/ec/ec');
const { ElgamalCiphertext_exec, ElgamalEnc } = require('../primitiv/encryption/ElGamal');
const { LiftedElgamalEnc } = require('../primitiv/encryption/LiftedElGamal');
const { PedersenPublicKey, PedersenPublicKey_exec, Commitment_exec } = require('../primitiv/commitment/pedersen_commitment');
const { NullificationArgument } = require('../protocol/nullification/NullificationArgument');

let chai = require('chai');
let assert = chai.assert;
let N = 100;

describe(`Test of 'NullificationArgument.js'`, function () {
    this.timeout(Math.max(4000, N * Math.ceil(Math.log2(N))));
    let global = {};
    let global_keyPair = ec.genKeyPair();
    let global_pk = global_keyPair.getPublic();
    let global_sk = global_keyPair.getPrivate();
    let global_ck = new PedersenPublicKey(ec, 2);

    let index = Math.floor(Math.random() * (N + 1));

    let pk_list = [];
    let sk;
    for (let i = 0; i < N; i++) {
        let keyPair = ec.genKeyPair();
        pk_list[i] = keyPair.getPublic();
        if (i === index) {
            sk = keyPair.getPrivate();
        }
    }

    let r_list = [];
    let E_list = [];
    for (let i = 0; i < N; i++) {
        r_list[i] = ec.randomBN();
        if (i !== index) {
            E_list[i] = LiftedElgamalEnc.encrypt(ec, global_pk, 0, r_list[i]);
        } else {
            E_list[i] = LiftedElgamalEnc.encrypt(ec, global_pk, 1, r_list[i]);
        }
    }

    it("Test of 'generateNullificationProof'", () => {
        global.proof = NullificationArgument.generateNullificationProof(
            ec,
            global_pk,
            global_ck,
            pk_list,
            E_list,
            r_list,
            sk,
            index
        );
    });

    it("Test of 'verifyNullificationProof'", () => {
        assert.isTrue(NullificationArgument.verifyNullificationProof(
            ec,
            global_pk,
            global_ck,
            pk_list,
            E_list,
            global.proof
        ));
    });
});