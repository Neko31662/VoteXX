const BN = require('../../primitiv/bn/bn');
const { transpose, vector_pow_vector, vector_pow_matrix } = require('./BasicFunction');
const { ElgamalCiphertext, ElgamalCiphertext_exec, ElgamalEnc } = require('../../primitiv/encryption/ElGamal');
const { PedersenPublicKey, PedersenPublicKey_exec, Commitment, Commitment_exec } = require('../../primitiv/commitment/pedersen_commitment');
const computeChallenge = require('../../primitiv/hash/hash');
const assert = require('assert');
const { encodePoint } = require('../../util/Serializer');

class MultiExponentiationArgument {
    /**
     * 
     * @param {EC} ec 
     * @param {Point} pk Elgamal public key
     * @param {PedersenPublicKey} ck Pedersen public key
     * @param {ElgamalCiphertext[][]} ctxt_matrix An Elgamal ciphertext matrix (m*n)
     * @param {ElgamalCiphertext} C An Elgamal ciphertext
     * @param {Commitment[]} c_A_vector A Pedersen commitment vector (length = m)
     * @param {BN[][]} A_matrix A BN matrix (n*m)
     * @param {BN[]} r_vector A BN vector (length = m)
     * @param {BN} rho A BN
     * @returns {MultiExponentiationProof}
     */
    generateMultiExponentiationProof(
        ec,
        pk,
        ck,
        ctxt_matrix,
        C,
        c_A_vector,
        A_matrix,
        r_vector,
        rho
    ) {
        let m = ctxt_matrix.length;
        let n = A_matrix.length;
        assert.ok(n > 0, "'n' should bigger than 0.");
        assert.ok(m > 0, "'m' should bigger than 0.");
        for (let i = 0; i < m; i++) {
            assert.ok(ctxt_matrix[i].length === n, `'ctxt_matrix[${i}].length' should be equal to n.`);
        }
        for (let i = 0; i < n; i++) {
            assert.ok(A_matrix[i].length === m, `'a_matrix[${i}].length' should be equal to m.`);
        }
        assert.ok(c_A_vector.length === m, "'c_A_vector.length' should be equal to m.");
        assert.ok(r_vector.length === m, "'r_vector.length' should be equal to m.");

        let ctxt_matrix_T = transpose(ctxt_matrix);//n*m
        let A_matrix_T = transpose(A_matrix);//m*n

        let { a0_vector, r0, b_vector, s_vector, tau_vector } = this.generateInitialMessage(ec, n, m, rho);
        let c_A0 = PedersenPublicKey_exec.commit(ec, ck, a0_vector, r0)[0];// c_A0 = com(a0_vector, r0)
        let c_B_vector = [];
        for (let i = 0; i < 2 * m; i++) {
            c_B_vector[i] = PedersenPublicKey_exec.commit(ec, ck, b_vector[i], s_vector[i])[0];// c_B_vector[k] = com(b_vector[i], s_vector[i])
        }
        let G = ec.curve.g;
        let E_vector = [];
        for (let k = 0; k < 2 * m; k++) {
            let Gbk = G.mul(b_vector[k]);// Gbk = G^b_vector[k];
            let tmp_Ck = ElgamalEnc.encrypt(ec, pk, Gbk, tau_vector[k]);// tmp_Ck = enc(Gbk; tau_vector[k])
            let product = ElgamalCiphertext_exec.identity(ec);
            for (let i = Math.max(m - k, 1); i <= m; i++) {
                let j = k - m + i;
                if (j > m) break;
                let Ci_vector = ctxt_matrix[i - 1];
                let aj_vector = (j === 0 ? a0_vector : A_matrix_T[j - 1]);
                let tmp = vector_pow_vector(Ci_vector, aj_vector);
                product = ElgamalCiphertext_exec.add(product, tmp);
            }
            E_vector[k] = ElgamalCiphertext_exec.add(tmp_Ck, product);
        }

        /*----- compute challenge -----*/
        let msg = [];
        msg.push(encodePoint(pk));
        for (let i = 0; i <= ck.n; i++) {
            msg.push(encodePoint(ck.generators[i]));
        }
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                msg.push(encodePoint(ctxt_matrix[i][j].c1));
                msg.push(encodePoint(ctxt_matrix[i][j].c2));
            }
        }
        msg.push(encodePoint(C.c1));
        msg.push(encodePoint(C.c2));
        for (let i = 0; i < m; i++) {
            msg.push(encodePoint(c_A_vector[i].commitment));
        }
        msg.push(encodePoint(c_A0.commitment));
        for (let i = 0; i < 2 * m; i++) {
            msg.push(encodePoint(c_B_vector[i].commitment));
        }
        for (let i = 0; i < 2 * m; i++) {
            msg.push(encodePoint(E_vector[i].c1));
            msg.push(encodePoint(E_vector[i].c2));
        }
        let x = computeChallenge(msg, ec.curve.n);
        /*-----------------------------*/

        let red = BN.red(ec.curve.n);
        let redx = x.tryToRed(red);
        let redx_pow_k = [];
        redx_pow_k[0] = new BN(1).tryToRed(red);
        for (let k = 1; k < 2 * m; k++) {
            redx_pow_k[k] = redx_pow_k[k - 1].redMul(redx);
        }

        let a_vector = a0_vector.map((value) => value.tryToRed(red));
        for (let i = 0; i < n; i++) {
            for (let j = 1; j <= m; j++) {
                let tmp = redx_pow_k[j].redMul(A_matrix[i][j - 1].tryToRed(red));
                a_vector[i] = a_vector[i].redAdd(tmp);
            }
        }

        let r = r0.tryToRed(red);
        for (let j = 1; j <= m; j++) {
            let tmp = redx_pow_k[j].redMul(r_vector[j - 1].tryToRed(red));
            r = r.redAdd(tmp);
        }

        let b = b_vector[0].tryToRed(red);
        for (let j = 1; j <= 2 * m - 1; j++) {
            let tmp = redx_pow_k[j].redMul(b_vector[j].tryToRed(red));
            b = b.redAdd(tmp);
        }

        let s = s_vector[0].tryToRed(red);
        for (let j = 1; j <= 2 * m - 1; j++) {
            let tmp = redx_pow_k[j].redMul(s_vector[j].tryToRed(red));
            s = s.redAdd(tmp);
        }

        let tau = tau_vector[0].tryToRed(red);
        for (let j = 1; j <= 2 * m - 1; j++) {
            let tmp = redx_pow_k[j].redMul(tau_vector[j].tryToRed(red));
            tau = tau.redAdd(tmp);
        }

        let proof = new MultiExponentiationProof(c_A0, c_B_vector, E_vector, a_vector, r, b, s, tau);
        return proof;
    };

    /**
     * 
     * @param {EC} ec 
     * @param {number} n 
     * @param {number} m 
     * @param {BN} rho 
     * @returns {{a0_vector:BN[], r0:BN, b_vector:BN[], s_vector:BN[], tau_vector:BN[]}}
     */
    generateInitialMessage(ec, n, m, rho) {
        let a0_vector = [];
        let b_vector = [];
        let s_vector = [];
        let tau_vector = [];
        let r0 = ec.randomBN();

        for (let i = 0; i < n; i++) {
            a0_vector[i] = ec.randomBN();
        }

        for (let i = 0; i < 2 * m; i++) {
            b_vector[i] = ec.randomBN();
            s_vector[i] = ec.randomBN();
            tau_vector[i] = ec.randomBN();
        }
        b_vector[m] = new BN(0);
        s_vector[m] = new BN(0);
        tau_vector[m] = rho;

        return { a0_vector, r0, b_vector, s_vector, tau_vector };
    }

    /**
     * 
     * @param {EC} ec 
     * @param {Point} pk Elgamal public key
     * @param {PedersenPublicKey} ck Pedersen public key
     * @param {ElgamalCiphertext[][]} ctxt_matrix An Elgamal ciphertext matrix (m*n)
     * @param {ElgamalCiphertext} C An Elgamal ciphertext
     * @param {Commitment[]} c_A_vector A Pedersen commitment vector (length = m)
     * @param {MultiExponentiationProof} proof 
     * @returns {Boolean}
     */
    verifyMultiExponentiationProof(
        ec,
        pk,
        ck,
        ctxt_matrix,
        C,
        c_A_vector,
        proof
    ) {
        let { c_A0, c_B_vector, E_vector, a_vector, r, b, s, tau } = proof;
        let m = ctxt_matrix.length;
        let n = ctxt_matrix[0].length;
        assert.ok(n > 0, "'n' should bigger than 0.");
        assert.ok(m > 0, "'m' should bigger than 0.");
        for (let i = 0; i < m; i++) {
            assert.ok(ctxt_matrix[i].length === n, `'ctxt_matrix[${i}].length' should be equal to n.`);
        }
        assert.ok(c_A_vector.length === m, `'c_A_vector.length' should be equal to m.`);
        assert.ok(c_B_vector.length === 2 * m, `'c_B_vector.length' should be equal to 2m.`);
        assert.ok(E_vector.length === 2 * m, `'E_vector.length' should be equal to 2m.`);
        assert.ok(a_vector.length === n, `'a_vector.length' should be equal to n.`);

        let ctxt_matrix_T = transpose(ctxt_matrix);//n*m

        /*----- compute challenge -----*/
        let msg = [];
        msg.push(encodePoint(pk));
        for (let i = 0; i <= ck.n; i++) {
            msg.push(encodePoint(ck.generators[i]));
        }
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                msg.push(encodePoint(ctxt_matrix[i][j].c1));
                msg.push(encodePoint(ctxt_matrix[i][j].c2));
            }
        }
        msg.push(encodePoint(C.c1));
        msg.push(encodePoint(C.c2));
        for (let i = 0; i < m; i++) {
            msg.push(encodePoint(c_A_vector[i].commitment));
        }
        msg.push(encodePoint(c_A0.commitment));
        for (let i = 0; i < 2 * m; i++) {
            msg.push(encodePoint(c_B_vector[i].commitment));
        }
        for (let i = 0; i < 2 * m; i++) {
            msg.push(encodePoint(E_vector[i].c1));
            msg.push(encodePoint(E_vector[i].c2));
        }
        let x = computeChallenge(msg, ec.curve.n);
        /*-----------------------------*/

        let red = BN.red(ec.curve.n);
        let redx = x.tryToRed(red);
        let redx_pow_k = [];
        redx_pow_k[0] = new BN(1).tryToRed(red);
        for (let k = 1; k < 2 * m; k++) {
            redx_pow_k[k] = redx_pow_k[k - 1].redMul(redx);
        }

        let invalidList = [];// debug
        let valid = true;
        let cur;

        let zeroCommitment = PedersenPublicKey_exec.commit(ec, ck, new BN(0), new BN(0))[0];
        cur = Commitment_exec.isEqual(zeroCommitment, c_B_vector[m]);
        valid &= cur;
        if (!cur) invalidList.push(1);

        cur = ElgamalCiphertext_exec.eq(C, E_vector[m]);
        valid &= cur;
        if (!cur) invalidList.push(2);

        let c_A_product = c_A0;
        for (let i = 0; i < c_A_vector.length; i++) {
            let tmp = Commitment_exec.pow(c_A_vector[i], redx_pow_k[i + 1]);
            c_A_product = Commitment_exec.mul(c_A_product, tmp);
        }
        let commitment_tmp1 = PedersenPublicKey_exec.commit(ec, ck, a_vector, r)[0];
        cur = Commitment_exec.isEqual(c_A_product, commitment_tmp1);
        valid &= cur;
        if (!cur) invalidList.push(3);

        let c_B_product = null;
        for (let i = 0; i < 2 * m; i++) {
            let tmp = Commitment_exec.pow(c_B_vector[i], redx_pow_k[i]);
            if (!c_B_product) c_B_product = tmp;
            else c_B_product = Commitment_exec.mul(c_B_product, tmp);
        }
        let commitment_tmp2 = PedersenPublicKey_exec.commit(ec, ck, b, s)[0];
        cur = Commitment_exec.isEqual(c_B_product, commitment_tmp2);
        valid &= cur;
        if (!cur) invalidList.push(4);

        let E_product = null;
        for (let i = 0; i < 2 * m; i++) {
            let tmp = ElgamalCiphertext_exec.mul(E_vector[i], redx_pow_k[i]);
            if (!E_product) E_product = tmp;
            else E_product = ElgamalCiphertext_exec.add(E_product, tmp);
        }
        let ctxt_tmp1 = ElgamalEnc.encrypt(ec, pk, ec.curve.g.mul(b), tau);
        for (let i = 1; i <= m; i++) {
            let tmp = vector_pow_vector(ctxt_matrix[i - 1], a_vector);
            tmp = ElgamalCiphertext_exec.mul(tmp, redx_pow_k[m - i]);
            ctxt_tmp1 = ElgamalCiphertext_exec.add(ctxt_tmp1, tmp);
        }
        cur = ElgamalCiphertext_exec.eq(E_product, ctxt_tmp1);
        valid &= cur;
        if (!cur) invalidList.push(5);

        if (valid) return true;
        else return false;
    }
}

class MultiExponentiationProof {
    constructor(
        c_A0,
        c_B_vector,
        E_vector,
        a_vector,
        r,
        b,
        s,
        tau,
    ) {
        this.c_A0 = c_A0;
        this.c_B_vector = c_B_vector;
        this.E_vector = E_vector;
        this.a_vector = a_vector;
        this.r = r;
        this.b = b;
        this.s = s;
        this.tau = tau;
    }
}

module.exports = {
    MultiExponentiationArgument: new MultiExponentiationArgument(),
    MultiExponentiationProof
};