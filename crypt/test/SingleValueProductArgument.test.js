const BN = require('../primitiv/bn/bn');
let ec = require('../primitiv/ec/ec');
const { SingleValueProductArgument } = require('../protocol/shuffle_argument/SingleValueProductArgument');
const { ElgamalCiphertext_exec, ElgamalEnc } = require('../primitiv/encryption/ElGamal');
const { PedersenPublicKey, PedersenPublicKey_exec, Commitment_exec } = require('../primitiv/commitment/pedersen_commitment');
const { transpose } = require('../protocol/shuffle_argument/BasicFunction');

let chai = require('chai');
let assert = chai.assert;
let n = 80;

describe(`Test of 'SingleValueProductArgument.js', n=${n}`, function () {
    let global = {};
    let keyPair = ec.genKeyPair();
    let pk = keyPair.getPublic();
    let sk = keyPair.getPrivate();
    let ck = new PedersenPublicKey(ec, n);

    let red = BN.red(ec.curve.n);
    let a_vector = [];
    for (let i = 0; i < n; i++) {
        a_vector[i] = ec.randomBN();
    }
    let r = ec.randomBN();
    let c_a = PedersenPublicKey_exec.commit(ec, ck, a_vector, r)[0];
    let b = new BN(1).tryToRed(red);
    for (let i = 0; i < n; i++) {
        b = b.redMul(a_vector[i].tryToRed(red));
    }
    b = b.fromRed();

    it("Test of the witness", () => {
        assert.isTrue(Commitment_exec.isEqual(c_a, PedersenPublicKey_exec.commit(ec, ck, a_vector, r)[0]), "Error 1");
        let tmp = new BN(1).tryToRed(red);
        for (let i = 0; i < n; i++) {
            tmp = tmp.redMul(a_vector[i].tryToRed(red));
        }
        tmp = tmp.fromRed();
        assert.isTrue(b.eq(tmp), "Error 2");
    });

    it("Test of 'SingleValueProductProof'", () => {
        global.proof = SingleValueProductArgument.generateSingleValueProductProof(
            ec,
            pk,
            ck,
            c_a,
            b,
            a_vector,
            r
        );
    });

    it("Test of 'verifySingleValueProductProof'", () => {
        assert.isTrue(SingleValueProductArgument.verifySingleValueProductProof(ec, pk, ck, c_a, b, global.proof));
    });
});