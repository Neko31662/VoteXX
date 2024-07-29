const BN = require('../primitiv/bn/bn');
let ec = require('../primitiv/ec/ec');
const { ProductArgument } = require('../protocol/shuffle_argument/ProductArgument');
const { ElgamalCiphertext_exec, ElgamalEnc } = require('../primitiv/encryption/ElGamal');
const { PedersenPublicKey, PedersenPublicKey_exec, Commitment_exec } = require('../primitiv/commitment/pedersen_commitment');
const { transpose } = require('../protocol/shuffle_argument/BasicFunction');

let chai = require('chai');
let assert = chai.assert;
let n = 80, m = 5;

describe(`Test of 'ProductArgument.js', n=${n}, m=${m}`, function () {
    let global = {};
    let keyPair = ec.genKeyPair();
    let pk = keyPair.getPublic();
    let sk = keyPair.getPrivate();
    let ck = new PedersenPublicKey(ec, n);

    let red = BN.red(ec.curve.n);
    let A_matrix = [];
    let b = new BN(1).tryToRed(red);
    for (let i = 0; i < n; i++) {
        A_matrix[i] = [];
        for (let j = 0; j < m; j++) {
            A_matrix[i][j] = ec.randomBN();
            b = b.redMul(A_matrix[i][j].tryToRed(red));
        }
    }
    let r_vector = [];
    for (let i = 0; i < m; i++) {
        r_vector[i] = ec.randomBN();
    }
    let A_matrix_T = transpose(A_matrix);
    let c_A_vector = [];
    for (let i = 0; i < m; i++) {
        c_A_vector[i] = PedersenPublicKey_exec.commit(ec, ck, A_matrix_T[i], r_vector[i])[0];
    }

    it("Test of 'generateProductProof'", () => {
        global.proof = ProductArgument.generateProductProof(
            ec,
            pk,
            ck,
            c_A_vector,
            b,
            A_matrix,
            r_vector
        );
    });

    it("Test of 'verifyProductProof'", () => {
        assert.isTrue(ProductArgument.verifyProductProof(ec, pk, ck, c_A_vector, b, global.proof));
    });
});