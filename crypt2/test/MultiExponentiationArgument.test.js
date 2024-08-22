const BN = require('../primitiv/bn/bn');
let ec = require('../primitiv/ec/ec');
const { MultiExponentiationArgument } = require('../protocol/shuffle_argument/MultiExponentiationArgument');
const { ElgamalCiphertext_exec, ElgamalEnc } = require('../primitiv/encryption/ElGamal');
const { PedersenPublicKey, PedersenPublicKey_exec, Commitment_exec } = require('../primitiv/commitment/pedersen_commitment');
const { transpose } = require('../protocol/shuffle_argument/BasicFunction');

let chai = require('chai');
let assert = chai.assert;
let n = 8, m = 5;

describe(`Test of 'MultiExponentiationArgument.js', n=${n}, m=${m}`, function () {
    let global = {};
    let keyPair = ec.genKeyPair();
    let pk = keyPair.getPublic();
    let sk = keyPair.getPrivate();
    let ck = new PedersenPublicKey(ec, n);
    let ctxt_matrix = [];
    let A_matrix = [];
    let r_vector = [];
    let rho = ec.randomBN();
    for (let i = 0; i < m; i++) {
        let arr = [];
        for (let j = 0; j < n; j++) {
            let tmp = ec.randomPoint();
            let ctxt = ElgamalEnc.encrypt(ec, pk, tmp);
            arr.push(ctxt);
        }
        ctxt_matrix.push(arr);
    }
    for (let i = 0; i < n; i++) {
        let arr = [];
        for (let j = 0; j < m; j++) {
            arr.push(ec.randomBN());
        }
        A_matrix.push(arr);
    }
    for (let i = 0; i < m; i++) {
        r_vector[i] = ec.randomBN();
    }
    let A_matrix_T = transpose(A_matrix);

    let c_A_vector = [];
    for (let i = 0; i < m; i++) {
        c_A_vector[i] = PedersenPublicKey_exec.commit(ec, ck, A_matrix_T[i], r_vector[i])[0];
    }

    let C = ElgamalEnc.encrypt(ec, pk, ec.infinitePoint(), rho);
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            let tmp = ElgamalCiphertext_exec.mul(ctxt_matrix[i][j], A_matrix[j][i]);
            C = ElgamalCiphertext_exec.add(C, tmp);
        }
    }


    this.timeout(Math.max(4000, n * m * m * 10));
    it("Test of 'generateMultiExponentiationProof'", () => {
        global.proof = MultiExponentiationArgument.generateMultiExponentiationProof(
            ec,
            pk,
            ck,
            ctxt_matrix,
            C,
            c_A_vector,
            A_matrix,
            r_vector,
            rho
        );
    });

    it("Test of 'verifyMultiExponentiationProof'", () => {
        assert.isTrue(MultiExponentiationArgument.verifyMultiExponentiationProof(
            ec,
            pk,
            ck,
            ctxt_matrix,
            C,
            c_A_vector,
            global.proof
        ));
        global.proof.tau = ec.randomBN();
        assert.isFalse(MultiExponentiationArgument.verifyMultiExponentiationProof(
            ec,
            pk,
            ck,
            ctxt_matrix,
            C,
            c_A_vector,
            global.proof
        ));
    });
});