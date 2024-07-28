const BN = require('../../primitiv/bn/bn');
const { transpose, vector_pow_vector, vector_pow_matrix } = require('./BasicFunction');
const { ElgamalCiphertext, ElgamalCiphertext_exec, ElgamalEnc } = require('../../primitiv/encryption/ElGamal');
const { PedersenPublicKey, PedersenPublicKey_exec, Commitment, Commitment_exec } = require('../../primitiv/commitment/pedersen_commitment');
const computeChallenge = require('../../primitiv/hash/hash');
const assert = require('assert');
const { encodePoint } = require('../../util/Serializer');
const { bilinear_map, ZeroArgument } = require('./ZeroArgument');

class HadamardProductArgument {
    /**
     * 
     * @param {EC} ec 
     * @param {Point} pk Elgamal public key
     * @param {PedersenPublicKey} ck Pedersen public key
     * @param {Commitment[]} c_A_vector A Pedersen commitment vector (length = m)
     * @param {Commitment} c_b A Pedersen commitment
     * @param {BN[][]} A_matrix A BN matrix (n*m)
     * @param {BN[]} r_vector A BN vector (length = m)
     * @param {BN[]} b_vector A BN vector (length = n)
     * @param {BN} s A BN
     */
    generateHadamardProductProof(
        ec,
        pk,
        ck,
        c_A_vector,
        c_b,
        A_matrix,
        r_vector,
        b_vector,
        s
    ) {
        let n = A_matrix.length;
        let m = r_vector.length;
        for (let i = 0; i < n; i++) {
            assert.ok(A_matrix[i].length === m, `'A_matrix[${i}].length' should be equal to m.`);
        }
        assert.ok(b_vector.length === n, "'b_vector.length' should be equal to n.");
        assert.ok(c_A_vector.length === m, "'c_A_vector.length' should be equal to m.");

        let A_matrix_T = transpose(A_matrix);

        let red = BN.red(ec.curve.n);
        let B_matrix = [];
        B_matrix[0] = A_matrix_T[0].map((value) => value.tryToRed(red));;
        for (let i = 1; i < m; i++) {
            B_matrix[i] = [];
            for (let j = 0; j < n; j++) {
                B_matrix[i][j] = B_matrix[i - 1][j].redMul(A_matrix_T[i][j].tryToRed(red));
            }
        }

        let { s_vector } = this.generateInitialMessage(ec, m, r_vector, s);
        let c_B_vector = [];
        c_B_vector[0] = c_A_vector[0];
        for (let i = 1; i < m - 1; i++) {
            c_B_vector[i] = PedersenPublicKey_exec.commit(ec, ck, B_matrix[i], s_vector[i])[0];
        }
        c_B_vector[m - 1] = c_b;

        /*----- compute challenge -----*/
        let msg = [];
        msg.push(encodePoint(pk));
        for (let i = 0; i <= ck.n; i++) {
            msg.push(encodePoint(ck.generators[i]));
        }
        for (let i = 0; i < c_A_vector.length; i++) {
            msg.push(encodePoint(c_A_vector[i].commitment));
        }
        msg.push(encodePoint(c_b.commitment));
        for (let i = 1; i < m - 1; i++) {
            msg.push(encodePoint(c_B_vector[i].commitment));
        }
        let x = computeChallenge(msg, ec.curve.n);
        msg.push(x.toString(16));
        let y = computeChallenge(msg, ec.curve.n);
        /*-----------------------------*/

        let redx = x.tryToRed(red);
        let redx_pow_k = [];
        redx_pow_k[0] = new BN(1).tryToRed(red);
        for (let k = 1; k <= m; k++) {
            redx_pow_k[k] = redx_pow_k[k - 1].redMul(redx);
        }

        let c_D_vector = [];
        for (let i = 0; i < m - 1; i++) {
            c_D_vector[i] = Commitment_exec.pow(c_B_vector[i], redx_pow_k[i + 1]);
        }

        let c_D = null;
        for (let i = 1; i < m; i++) {
            let tmp = Commitment_exec.pow(c_B_vector[i], redx_pow_k[i]);
            if (!c_D) {
                c_D = tmp;
            } else {
                c_D = Commitment_exec.mul(c_D, tmp);
            }
        }

        let neg1_vector = [];
        for (let i = 0; i < n; i++) {
            neg1_vector[i] = ec.curve.n.subn(1);
        }

        let c_neg1 = PedersenPublicKey_exec.commit(ec, ck, neg1_vector, new BN(0))[0];

        let d_matrix = [];
        let t_vector = [];
        for (let i = 0; i < m - 1; i++) {
            d_matrix[i] = [];
            t_vector[i] = redx_pow_k[i + 1].redMul(s_vector[i].tryToRed(red));
            for (let j = 0; j < n; j++) {
                d_matrix[i][j] = redx_pow_k[i + 1].redMul(B_matrix[i][j].tryToRed(red));
            }
        }

        let d_vector = null;
        for (let i = 1; i < m; i++) {
            if (!d_vector) {
                d_vector = [];
                for (let j = 0; j < n; j++) {
                    d_vector[j] = redx_pow_k[i].redMul(B_matrix[i][j]);
                }
            } else {
                for (let j = 0; j < n; j++) {
                    let tmp = redx_pow_k[i].redMul(B_matrix[i][j]);
                    d_vector[j] = d_vector[j].redAdd(tmp);
                }
            }
        }

        let t = null;
        for (let i = 1; i < m; i++) {
            let tmp = redx_pow_k[i].redMul(s_vector[i].tryToRed(red));
            if (!t) {
                t = tmp;
            } else {

                t = t.redAdd(tmp);
            }
        }

        let ZPst_c_A_vector = [];//ZPst = ZeroProof statement
        for (let i = 1; i < m; i++) {
            ZPst_c_A_vector.push(c_A_vector[i]);
        }
        ZPst_c_A_vector.push(c_neg1);

        let ZPst_c_B_vector = [];
        for (let i = 0; i < m - 1; i++) {
            ZPst_c_B_vector.push(c_D_vector[i]);
        }
        ZPst_c_B_vector.push(c_D);

        let ZPst_y = y;

        let ZPwt_A_matrix_T = [];//ZPwt = ZeroProof witness
        for (let i = 1; i < m; i++) {
            ZPwt_A_matrix_T.push(A_matrix_T[i]);
        }
        ZPwt_A_matrix_T.push(neg1_vector);
        let ZPwt_A_matrix = transpose(ZPwt_A_matrix_T);

        let ZPwt_r_vector = [];
        for (let i = 0; i < m - 1; i++) {
            ZPwt_r_vector.push(r_vector[i + 1]);
        }
        ZPwt_r_vector[m - 1] = new BN(0);

        let ZPwt_B_matrix_T = [];
        for (let i = 0; i < m - 1; i++) {
            ZPwt_B_matrix_T.push(d_matrix[i]);
        }
        ZPwt_B_matrix_T.push(d_vector);
        let ZPwt_B_matrix = transpose(ZPwt_B_matrix_T);

        let ZPwt_s_vector = [];
        for (let i = 0; i < m - 1; i++) {
            ZPwt_s_vector.push(t_vector[i]);
        }
        ZPwt_s_vector.push(t);

        let ZeroProof = ZeroArgument.generateZeroProof(
            ec,
            pk,
            ck,
            ZPst_c_A_vector,
            ZPst_c_B_vector,
            ZPst_y,
            ZPwt_A_matrix,
            ZPwt_r_vector,
            ZPwt_B_matrix,
            ZPwt_s_vector
        );

        let proof = new HadamardProductProof(c_B_vector, ZeroProof);
        return proof;
    }

    /**
     * 
     * @param {EC} ec 
     * @param {Point} pk Elgamal public key
     * @param {PedersenPublicKey} ck Pedersen public key
     * @param {Commitment[]} c_A_vector A Pedersen commitment vector (length = m)
     * @param {Commitment} c_b A Pedersen commitment 
     * @param {HadamardProductProof} proof 
     * @returns {boolean}
     */
    verifyHadamardProductProof(
        ec,
        pk,
        ck,
        c_A_vector,
        c_b,
        proof
    ) {
        let { c_B_vector, ZeroProof } = proof;
        let m = c_A_vector.length;
        let n = ZeroProof.a_vector.length;
        assert.ok(c_B_vector.length === m, "'c_B_vector.length' should be equal to m.");

        /*----- compute challenge -----*/
        let msg = [];
        msg.push(encodePoint(pk));
        for (let i = 0; i <= ck.n; i++) {
            msg.push(encodePoint(ck.generators[i]));
        }
        for (let i = 0; i < c_A_vector.length; i++) {
            msg.push(encodePoint(c_A_vector[i].commitment));
        }
        msg.push(encodePoint(c_b.commitment));
        for (let i = 1; i < m - 1; i++) {
            msg.push(encodePoint(c_B_vector[i].commitment));
        }
        let x = computeChallenge(msg, ec.curve.n);
        msg.push(x.toString(16));
        let y = computeChallenge(msg, ec.curve.n);
        /*-----------------------------*/

        let red = BN.red(ec.curve.n);
        let redx = x.tryToRed(red);
        let redx_pow_k = [];
        redx_pow_k[0] = new BN(1).tryToRed(red);
        for (let k = 1; k <= m; k++) {
            redx_pow_k[k] = redx_pow_k[k - 1].redMul(redx);
        }

        let invalidList = [];// debug
        let valid = true;
        let cur;

        cur = Commitment_exec.isEqual(c_A_vector[0], c_B_vector[0]);
        valid &= cur;
        if (!cur) invalidList.push(1);

        cur = Commitment_exec.isEqual(c_B_vector[m - 1], c_b);
        valid &= cur;
        if (!cur) invalidList.push(2);

        let c_D_vector = [];
        for (let i = 0; i < m - 1; i++) {
            c_D_vector[i] = Commitment_exec.pow(c_B_vector[i], redx_pow_k[i + 1]);
        }

        let c_D = null;
        for (let i = 1; i < m; i++) {
            let tmp = Commitment_exec.pow(c_B_vector[i], redx_pow_k[i]);
            if (!c_D) {
                c_D = tmp;
            } else {
                c_D = Commitment_exec.mul(c_D, tmp);
            }
        }

        let neg1_vector = [];
        for (let i = 0; i < n; i++) {
            neg1_vector[i] = ec.curve.n.subn(1);
        }

        let c_neg1 = PedersenPublicKey_exec.commit(ec, ck, neg1_vector, new BN(0))[0];

        let ZPst_c_A_vector = [];//ZPst = ZeroProof statement
        for (let i = 1; i < m; i++) {
            ZPst_c_A_vector.push(c_A_vector[i]);
        }
        ZPst_c_A_vector.push(c_neg1);

        let ZPst_c_B_vector = [];
        for (let i = 0; i < m - 1; i++) {
            ZPst_c_B_vector.push(c_D_vector[i]);
        }
        ZPst_c_B_vector.push(c_D);

        let ZPst_y = y;

        cur = ZeroArgument.verifyZeroProof(
            ec,
            pk,
            ck,
            ZPst_c_A_vector,
            ZPst_c_B_vector,
            ZPst_y,
            ZeroProof
        );
        valid &= cur;
        if (!cur) invalidList.push(2);

        if (valid) return true;
        else return false;
    }

    /**
     * 
     * @param {EC} ec 
     * @param {number} m 
     * @param {BN[]} r_vector 
     * @param {BN} s 
     * @returns {BN[]}
     */
    generateInitialMessage(ec, m, r_vector, s) {
        let s_vector = [];
        s_vector[0] = r_vector[0].clone();
        for (let i = 1; i < m - 1; i++) {
            s_vector[i] = ec.randomBN();
        }
        s_vector[m - 1] = s.clone();
        return { s_vector };
    }
}

class HadamardProductProof {
    /**
     * 
     * @param {Commitment[]} c_B_vector 
     * @param {ZeroProof} ZeroProof 
     */
    constructor(
        c_B_vector,
        ZeroProof
    ) {
        this.c_B_vector = c_B_vector;
        this.ZeroProof = ZeroProof;
    }
}

module.exports = {
    HadamardProductArgument: new HadamardProductArgument(),
    HadamardProductProof
};