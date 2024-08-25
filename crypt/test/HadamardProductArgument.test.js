const BN = require('../primitiv/bn/bn');
let ec = require('../primitiv/ec/ec');
const { HadamardProductArgument } = require('../protocol/shuffle_argument/HadamardProductArgument');
const { ElgamalCiphertext_exec, ElgamalEnc } = require('../primitiv/encryption/ElGamal');
const { PedersenPublicKey, PedersenPublicKey_exec, Commitment_exec } = require('../primitiv/commitment/pedersen_commitment');
const { transpose } = require('../protocol/shuffle_argument/BasicFunction');

let chai = require('chai');
let assert = chai.assert;

let n = 80, m = 5;

describe(`Test of 'HadamardProductArgument.js', n=${n}, m=${m}`, function () {
    let global = {};
    let keyPair = ec.genKeyPair();
    let pk = keyPair.getPublic();
    let sk = keyPair.getPrivate();
    let ck = new PedersenPublicKey(ec, n);

    let red = BN.red(ec.curve.n);
    let A_matrix_T = [];
    for (let i = 0; i < m; i++) {
        A_matrix_T[i] = [];
        for (let j = 0; j < n; j++) {
            A_matrix_T[i][j] = ec.randomBN();
        }
    }
    let b_vector = [];
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (!b_vector[j]) {
                b_vector[j] = A_matrix_T[i][j].tryToRed(red);
            } else {
                b_vector[j] = b_vector[j].redMul(A_matrix_T[i][j].tryToRed(red));
            }
        }
    }
    b_vector = b_vector.map(value => value.fromRed());

    let [c_b, s] = PedersenPublicKey_exec.commit(ec, ck, b_vector);

    let r_vector = [];
    let c_A_vector = [];
    for (let i = 0; i < m; i++) {
        let tmp = PedersenPublicKey_exec.commit(ec, ck, A_matrix_T[i]);
        c_A_vector[i] = tmp[0];
        r_vector[i] = tmp[1];
    }

    let A_matrix = transpose(A_matrix_T);


    this.timeout(Math.max(4000, n * m * 10));
    it("Test of the witness", () => {
        for (let i = 0; i < m; i++) {
            let tmp = PedersenPublicKey_exec.commit(ec, ck, A_matrix_T[i], r_vector[i])[0];
            assert.isTrue(Commitment_exec.isEqual(tmp, c_A_vector[i]));
        }
        let tmp = PedersenPublicKey_exec.commit(ec, ck, b_vector, s)[0];
        assert.isTrue(Commitment_exec.isEqual(tmp, c_b));
        for (let i = 0; i < n; i++) {
            let cur = new BN(1).tryToRed(red);
            for (let j = 0; j < m; j++) {
                cur = cur.redMul(A_matrix[i][j].tryToRed(red));
            }
            cur = cur.fromRed();
            assert.isTrue(cur.eq(b_vector[i]));
        }
    });

    it("Test of 'generateHadamardProductProof'", () => {
        global.proof = HadamardProductArgument.generateHadamardProductProof(
            ec,
            pk,
            ck,
            c_A_vector,
            c_b,
            A_matrix,
            r_vector,
            b_vector,
            s
        );
    });

    it("Test of 'verifyHadamardProductProof'", () => {
        assert.isTrue(HadamardProductArgument.verifyHadamardProductProof(
            ec,
            pk,
            ck,
            c_A_vector,
            c_b,
            global.proof
        ));
    });
});