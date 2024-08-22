const BN = require('../primitiv/bn/bn');
let ec = require('../primitiv/ec/ec');
const { bilinear_map, ZeroArgument } = require('../protocol/shuffle_argument/ZeroArgument');
const { ElgamalCiphertext_exec, ElgamalEnc } = require('../primitiv/encryption/ElGamal');
const { PedersenPublicKey, PedersenPublicKey_exec, Commitment_exec } = require('../primitiv/commitment/pedersen_commitment');
const { transpose } = require('../protocol/shuffle_argument/BasicFunction');

let chai = require('chai');
let assert = chai.assert;
let n = 80, m = 5;

describe(`Test of 'ZeroArgument.js', n=${n}, m=${m}`, function () {
    let global = {};
    let keyPair = ec.genKeyPair();
    let pk = keyPair.getPublic();
    let sk = keyPair.getPrivate();
    let ck = new PedersenPublicKey(ec, n);

    let red = BN.red(ec.curve.n);
    let A_matrix = [];
    let B_matrix = [];

    for (let i = 0; i < n; i++) {
        let tmp1 = [], tmp2 = [], tmp3 = [];
        let last = (new BN(0)).tryToRed(red);
        for (let j = 0; j < m - 1; j++) {
            tmp1[j] = ec.randomBN().tryToRed(red);
            last = last.redSub(tmp1[j]);
        }
        tmp1[m - 1] = last;

        for (let j = 0; j < m; j++) {
            tmp2[j] = ec.randomBN().tryToRed(red);
            tmp3[j] = tmp1[j].redMul(tmp2[j].redInvm());
        }
        A_matrix.push(tmp2);
        B_matrix.push(tmp3);
    }
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            A_matrix[i][j] = A_matrix[i][j].fromRed();
            B_matrix[i][j] = B_matrix[i][j].fromRed();
        }
    }
    let A_matrix_T = transpose(A_matrix);
    let B_matrix_T = transpose(B_matrix);

    let r_vector = [];
    let s_vector = [];
    for (let i = 0; i < m; i++) {
        r_vector.push(ec.randomBN());
        s_vector.push(ec.randomBN());
    }

    let c_A_vector = [];
    let c_B_vector = [];
    for (let i = 0; i < m; i++) {
        c_A_vector.push(PedersenPublicKey_exec.commit(ec, ck, A_matrix_T[i], r_vector[i])[0]);
        c_B_vector.push(PedersenPublicKey_exec.commit(ec, ck, B_matrix_T[i], s_vector[i])[0]);
    }

    let y = ec.randomBN();


    this.timeout(Math.max(4000, n * m * 10));
    it("Test of the witness", () => {
        let tmp = new BN(0).tryToRed(red);
        for (let i = 0; i < m; i++) {
            tmp = tmp.redAdd(bilinear_map(ec, A_matrix_T[i], B_matrix_T[i], y).tryToRed(red));
        }
        tmp = tmp.fromRed();
        assert.isTrue(tmp.eq(new BN(0)), "Error 1");
        for (let i = 0; i < m; i++) {
            assert.isTrue(Commitment_exec.isEqual(c_A_vector[i], PedersenPublicKey_exec.commit(ec, ck, A_matrix_T[i], r_vector[i])[0]), "Error 2");
            assert.isTrue(Commitment_exec.isEqual(c_B_vector[i], PedersenPublicKey_exec.commit(ec, ck, B_matrix_T[i], s_vector[i])[0]), "Error 3");
        }
    });

    it("Test of 'generateZeroProof'", () => {
        global.proof = ZeroArgument.generateZeroProof(
            ec,
            pk,
            ck,
            c_A_vector,
            c_B_vector,
            y,
            A_matrix,
            r_vector,
            B_matrix,
            s_vector
        );
    });

    it("Test of 'verifyZeroProof'", () => {
        assert.isTrue(ZeroArgument.verifyZeroProof(ec, pk, ck, c_A_vector, c_B_vector, y, global.proof));
    });
});