const BN = require('../../primitiv/bn/bn');
const { transpose, vector_pow_vector, vector_pow_matrix } = require('./BasicFunction');
const { ElgamalCiphertext, ElgamalCiphertext_exec, ElgamalEnc } = require('../../primitiv/encryption/ElGamal');
const { PedersenPublicKey, PedersenPublicKey_exec, Commitment, Commitment_exec } = require('../../primitiv/commitment/pedersen_commitment');
const computeChallenge = require('../../primitiv/hash/hash');
const assert = require('assert');
const { encodePoint } = require('../../util/Serializer');

/**
 * Calculate the sum of (a_vector[i] * b_vector[i] * y^(i+1) ) where i from 0 to n-1.
 * @param {EC} ec 
 * @param {BN[]} a_vector 
 * @param {BN[]} b_vector 
 * @param {BN} y 
 * @returns {BN}
 */
function bilinear_map(ec, a_vector, b_vector, y) {
    let n = a_vector.length;
    assert.ok(b_vector.length === n, `'a_vector.length'(${n}) should be equal to 'b_vector.length'(${b_vector.length}).`);

    let red = BN.red(ec.curve.n);
    let ans = new BN(0).tryToRed(red);
    let y_pow = new BN(1).tryToRed(red);
    y = y.tryToRed(red);
    for (let i = 0; i < n; i++) {
        y_pow = y_pow.redMul(y);
        let tmp = y_pow.redMul(a_vector[i].tryToRed(red));
        tmp = tmp.redMul(b_vector[i].tryToRed(red));
        ans = ans.redAdd(tmp);
    }
    return ans.fromRed();
}

class ZeroArgument {

    /**
     * 
     * @param {EC} ec 
     * @param {Point} pk Elgamal public key
     * @param {PedersenPublicKey} ck Pedersen public key
     * @param {Commitment[]} c_A_vector A Pedersen commitment vector (length = m)
     * @param {Commitment[]} c_B_vector A Pedersen commitment vector (length = m)
     * @param {BN} y Parameter for bilinear map * 
     * @param {BN[][]} A_matrix A BN matrix (n*m)
     * @param {BN[]} r_vector A BN vector (length = m)
     * @param {BN[][]} B_matrix A BN matrix (n*m)
     * @param {BN[]} s_vector A BN vector (length = m)
     * @returns {ZeroProof}
     */
    generateZeroProof(
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
    ) {
        let n = A_matrix.length;
        let m = r_vector.length;
        assert.ok(B_matrix.length === n, "'B_matrix.length' should be equal to n.");
        for (let i = 0; i < n; i++) {
            assert.ok(A_matrix[i].length === m, `'A_matrix[${i}].length' should be equal to m.`);
            assert.ok(B_matrix[i].length === m, `'B_matrix[${i}].length' should be equal to m.`);
        }
        assert.ok(c_A_vector.length === m, "'c_A_vector.length' should be equal to m.");
        assert.ok(c_B_vector.length === m, "'c_B_vector.length' should be equal to m.");
        assert.ok(s_vector.length === m, "'s_vector.length' should be equal to m.");

        let A_matrix_T = transpose(A_matrix);
        let B_matrix_T = transpose(B_matrix);

        let { a0_vector, bm_vector, r0, sm, t_vector } = this.generateInitialMessage(ec, n, m);

        let A_matrix_r = [a0_vector].concat(A_matrix_T);
        let B_matrix_r = B_matrix_T.concat([bm_vector]);

        let c_A0 = PedersenPublicKey_exec.commit(ec, ck, a0_vector, r0)[0];
        let c_Bm = PedersenPublicKey_exec.commit(ec, ck, bm_vector, sm)[0];

        let d_vector = [];
        let red = BN.red(ec.curve.n);
        for (let k = 0; k <= 2 * m; k++) {
            for (let i = Math.max(0, k - m); i <= m; i++) {
                let j = m - k + i;
                if (j > m) break;
                if (!d_vector[k]) {
                    d_vector[k] = bilinear_map(ec, A_matrix_r[i], B_matrix_r[j], y).tryToRed(red);
                } else {
                    d_vector[k] = d_vector[k].redAdd(bilinear_map(ec, A_matrix_r[i], B_matrix_r[j], y).tryToRed(red));
                }
            }
        }
        let c_D_vector = [];
        for (let i = 0; i <= 2 * m; i++) {
            c_D_vector[i] = PedersenPublicKey_exec.commit(ec, ck, d_vector[i], t_vector[i])[0];
        }

        /*----- compute challenge -----*/
        let msg = [];
        msg.push(encodePoint(pk));
        for (let i = 0; i <= ck.n; i++) {
            msg.push(encodePoint(ck.generators[i]));
        }
        for (let i = 0; i < m; i++) {
            msg.push(encodePoint(c_A_vector[i].commitment));
        }
        for (let i = 0; i < m; i++) {
            msg.push(encodePoint(c_B_vector[i].commitment));
        }
        msg.push(y.toString(16));
        msg.push(encodePoint(c_A0.commitment));
        msg.push(encodePoint(c_Bm.commitment));
        for (let i = 0; i <= 2 * m; i++) {
            msg.push(encodePoint(c_D_vector[i].commitment));
        }
        let x = computeChallenge(msg, ec.curve.n);
        /*-----------------------------*/

        let redx = x.tryToRed(red);
        let redx_pow_k = [];
        redx_pow_k[0] = new BN(1).tryToRed(red);
        for (let k = 1; k <= 2 * m; k++) {
            redx_pow_k[k] = redx_pow_k[k - 1].redMul(redx);
        }

        let a_vector = A_matrix_r[0].map((value) => value.tryToRed(red));
        for (let i = 1; i <= m; i++) {
            for (let j = 0; j < n; j++) {
                let tmp = redx_pow_k[i].redMul(A_matrix_r[i][j].tryToRed(red));
                a_vector[j] = a_vector[j].redAdd(tmp);
            }
        }

        let r = r0.tryToRed(red);
        for (let i = 1; i <= m; i++) {
            let tmp = redx_pow_k[i].redMul(r_vector[i - 1].tryToRed(red));
            r = r.redAdd(tmp);
        }

        let b_vector = B_matrix_r[m].map((value) => value.tryToRed(red));
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                let tmp = redx_pow_k[m - i].redMul(B_matrix_r[i][j].tryToRed(red));
                b_vector[j] = b_vector[j].redAdd(tmp);
            }
        }

        let s = sm.tryToRed(red);
        for (let i = 0; i < m; i++) {
            let tmp = redx_pow_k[m - i].redMul(s_vector[i].tryToRed(red));
            s = s.redAdd(tmp);
        }

        let t = t_vector[0].tryToRed(red);
        for (let i = 1; i <= 2 * m; i++) {
            let tmp = redx_pow_k[i].redMul(t_vector[i].tryToRed(red));
            t = t.redAdd(tmp);
        }

        let proof = new ZeroProof(c_A0, c_Bm, c_D_vector, a_vector, b_vector, r, s, t);
        return proof;
    }

    /**
     * 
     * @param {EC} ec 
     * @param {Point} pk Elgamal public key
     * @param {PedersenPublicKey} ck Pedersen public key
     * @param {Commitment[]} c_A_vector A Pedersen commitment vector (length = m)
     * @param {Commitment[]} c_B_vector A Pedersen commitment vector (length = m)
     * @param {BN} y Parameter for bilinear map * 
     * @param {*} proof 
     * @returns {Boolean}
     */
    verifyZeroProof(
        ec,
        pk,
        ck,
        c_A_vector,
        c_B_vector,
        y,
        proof
    ) {
        let { c_A0, c_Bm, c_D_vector, a_vector, b_vector, r, s, t } = proof;
        let n = a_vector.length;
        let m = c_A_vector.length;
        assert.ok(b_vector.length === n, "'b_vector.length' should be equal to n.");
        assert.ok(c_B_vector.length === m, "'c_B_vector.length' should be equal to m.");
        assert.ok(c_D_vector.length === 2 * m + 1, "'c_D_vector.length' should be equal to 2m+1.");

        /*----- compute challenge -----*/
        let msg = [];
        msg.push(encodePoint(pk));
        for (let i = 0; i <= ck.n; i++) {
            msg.push(encodePoint(ck.generators[i]));
        }
        for (let i = 0; i < m; i++) {
            msg.push(encodePoint(c_A_vector[i].commitment));
        }
        for (let i = 0; i < m; i++) {
            msg.push(encodePoint(c_B_vector[i].commitment));
        }
        msg.push(y.toString(16));
        msg.push(encodePoint(c_A0.commitment));
        msg.push(encodePoint(c_Bm.commitment));
        for (let i = 0; i <= 2 * m; i++) {
            msg.push(encodePoint(c_D_vector[i].commitment));
        }
        let x = computeChallenge(msg, ec.curve.n);
        /*-----------------------------*/

        let red = BN.red(ec.curve.n);
        let redx = x.tryToRed(red);
        let redx_pow_k = [];
        redx_pow_k[0] = new BN(1).tryToRed(red);
        for (let k = 1; k <= 2 * m; k++) {
            redx_pow_k[k] = redx_pow_k[k - 1].redMul(redx);
        }

        let invalidList = [];// debug
        let valid = true;
        let cur;

        let zeroCommitment = PedersenPublicKey_exec.commit(ec, ck, new BN(0), new BN(0))[0];
        cur = Commitment_exec.isEqual(zeroCommitment, c_D_vector[m + 1]);
        valid &= cur;
        if (!cur) invalidList.push(1);

        let c_A_product = c_A0;
        for (let i = 1; i <= m; i++) {
            let tmp = Commitment_exec.pow(c_A_vector[i - 1], redx_pow_k[i]);
            c_A_product = Commitment_exec.mul(c_A_product, tmp);
        }
        let commitment_tmp1 = PedersenPublicKey_exec.commit(ec, ck, a_vector, r)[0];
        cur = Commitment_exec.isEqual(c_A_product, commitment_tmp1);
        valid &= cur;
        if (!cur) invalidList.push(2);

        let c_B_product = c_Bm;
        for (let i = 0; i < m; i++) {
            let tmp = Commitment_exec.pow(c_B_vector[i], redx_pow_k[m - i]);
            c_B_product = Commitment_exec.mul(c_B_product, tmp);
        }
        let commitment_tmp2 = PedersenPublicKey_exec.commit(ec, ck, b_vector, s)[0];
        cur = Commitment_exec.isEqual(c_B_product, commitment_tmp2);
        valid &= cur;
        if (!cur) invalidList.push(3);

        let c_D_product = c_D_vector[0];
        for (let i = 1; i <= 2 * m; i++) {
            let tmp = Commitment_exec.pow(c_D_vector[i], redx_pow_k[i]);
            c_D_product = Commitment_exec.mul(c_D_product, tmp);
        }
        let bi_a_b = bilinear_map(ec, a_vector, b_vector, y);
        let commitment_tmp3 = PedersenPublicKey_exec.commit(ec, ck, bi_a_b, t)[0];
        cur = Commitment_exec.isEqual(c_D_product, commitment_tmp3);
        valid &= cur;
        if (!cur) invalidList.push(4);

        if (valid) return true;
        else return false;
    }

    /**
     * 
     * @param {EC} ec 
     * @param {number} n 
     * @param {number} m
     * @returns {{a0_vector:BN[], bm_vector:BN[], r0:BN, sm:BN, t_vector:BN[]}}
     */
    generateInitialMessage(ec, n, m) {
        let a0_vector = [];
        let bm_vector = [];
        let t_vector = [];
        let r0 = ec.randomBN();
        let sm = ec.randomBN();

        for (let i = 0; i < n; i++) {
            a0_vector[i] = ec.randomBN();
            bm_vector[i] = ec.randomBN();
        }
        for (let i = 0; i <= 2 * m; i++) {
            t_vector[i] = ec.randomBN();
        }
        t_vector[m + 1] = new BN(0);
        return { a0_vector, bm_vector, r0, sm, t_vector };
    }
}

class ZeroProof {
    constructor(
        c_A0,
        c_Bm,
        c_D_vector,
        a_vector,
        b_vector,
        r,
        s,
        t
    ) {
        this.c_A0 = c_A0;
        this.c_Bm = c_Bm;
        this.c_D_vector = c_D_vector;
        this.a_vector = a_vector;
        this.b_vector = b_vector;
        this.r = r;
        this.s = s;
        this.t = t;
    }
}

module.exports = {
    bilinear_map,
    ZeroArgument: new ZeroArgument(),
    ZeroProof
};