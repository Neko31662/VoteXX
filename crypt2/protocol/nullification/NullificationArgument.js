const BN = require('../../primitiv/bn/bn');
const { LiftedElgamalEnc } = require('../../primitiv/encryption/LiftedElGamal');
const { ElgamalCiphertext, ElgamalCiphertext_exec, ElgamalEnc } = require('../../primitiv/encryption/ElGamal');
const { PedersenPublicKey, PedersenPublicKey_exec, Commitment, Commitment_exec } = require('../../primitiv/commitment/pedersen_commitment');
const computeChallenge = require('../../primitiv/hash/hash');
const { encodePoint } = require('../../util/Serializer');
const assert = require('assert');

/**
 * @typedef {import('../../primitiv/encryption/ElGamal').ElgamalCiphertext} ElgamalCiphertext
 * @typedef {import('../../primitiv/commitment/pedersen_commitment').PedersenPublicKey} PedersenPublicKey
 * @typedef {import('../../primitiv/commitment/pedersen_commitment').Commitment} Commitment
 */

/**
 * 
 * @param {BN[]} poly1 A polynomial, '[a0, a1, a2, ...]' means 'a0 + a1·x + a2·x^2 + ...'
 * @param {BN[]} poly2 A polynomial
 * @param {BN} mod modulus
 * @return {BN[]}
 */
function polyMultiply(poly1, poly2, mod) {
    let l = poly1.length + poly2.length - 1;

    let res = [];
    for (let i = 0; i < l; i++) {
        res[i] = new BN(0);
    }

    for (let i = 0; i < poly1.length; i++) {
        for (let j = 0; j < poly2.length; j++) {
            res[i + j].iadd(poly1[i].mul(poly2[j]));
        }
    }

    for (let i = 0; i < l; i++) {
        res[i] = res[i].umod(mod);
    }

    return res;
}

/**
 * 
 * @param {number} num 
 * @param {number | undefined} bits 
 * @returns {number[]}
 */
function toBinary(num, bits) {
    let res = [];
    if (!bits) {
        while (num) {
            res.push(num & 1);
            num >>= 1;
        }
    } else {
        for (let i = 0; i < bits; i++) {
            res.push(num & 1);
            num >>= 1;
        }
    }
    return res;
}

/**
 * 
 * @param {number} num 
 * @param {number | undefined} bits 
 * @returns {string}
 */
function toBinaryString(num, bits) {
    let res = "";
    if (!bits) {
        while (num) {
            res += (num & 1);
            num >>= 1;
        }
    } else {
        for (let i = 0; i < bits; i++) {
            res += (num & 1);
            num >>= 1;
        }
    }
    return res;
}

class NullificationArgument {
    /**
     * 
     * @param {EC} ec 
     * @param {Point} global_pk 
     * @param {PedersenPublicKey} global_ck 
     * @param {Point[]} pk_list 
     * @param {ElgamalCiphertext[]} E_list 
     * @param {BN[]} r_list 
     * @param {BN} sk 
     * @param {number} index pk_list[index] == g^sk
     * @returns {NullificationProof}
     */
    generateNullificationProof(
        ec,
        global_pk,
        global_ck,
        pk_list,
        E_list,
        r_list,
        sk,
        index
    ) {
        let N = pk_list.length;
        assert.ok(E_list.length === N, "'E_list.length' should be N.");
        assert.ok(r_list.length === N, "'r_list.length' should be N.");
        assert.ok(0 <= index && index < N, "'index' should between 0 and N-1.");

        /*----- compute challenge y -----*/
        let msg = [];
        msg.push(encodePoint(global_pk));
        for (let i = 0; i <= global_ck.n; i++) {
            msg.push(encodePoint(global_ck.generators[i]));
        }
        for (let i = 0; i < N; i++) {
            msg.push(encodePoint(pk_list[i]));
        }
        for (let i = 0; i < N; i++) {
            msg.push(encodePoint(E_list[i].c1));
            msg.push(encodePoint(E_list[i].c2));
        }
        let y = computeChallenge(msg, ec.curve.n);
        /*-------------------------------*/

        let red = BN.red(ec.curve.n);
        let redy = y.tryToRed(red);
        let redy_pow_k = [];
        redy_pow_k[0] = new BN(1).tryToRed(red);
        for (let k = 1; k <= N; k++) {
            redy_pow_k[k] = redy_pow_k[k - 1].redMul(redy);
        }

        let n = Math.ceil(Math.log2(N));
        let l_bin = toBinary(index, n);

        let {
            t, s_prime, t_prime, tau_vector, a_vector, s_vector, t_vector, rho_vector, R_vector
        } = this.generateInitialMessage(ec, n);

        let c = PedersenPublicKey_exec.commit(ec, global_ck, sk, t)[0];
        let cneg = c.commitment.neg();

        let c_vector = [];
        for (let i = 0; i < N; i++) {
            c_vector[i] = pk_list[i].add(cneg);
        }

        let polys = this.getAllPolys(ec, N, l_bin, a_vector);

        let p = (i, k) => {
            return polys[i][k] ? polys[i][k] : new BN(0);
        };

        let c_l_vector = [];
        let c_a_vector = [];
        let c_b_vector = [];
        let c_d_vector = [];
        let D_vector = [];
        for (let j = 0; j < n; j++) {
            c_l_vector[j] = PedersenPublicKey_exec.commit(ec, global_ck, new BN(l_bin[j]), tau_vector[j])[0];
            c_a_vector[j] = PedersenPublicKey_exec.commit(ec, global_ck, a_vector[j], s_vector[j])[0];
            c_b_vector[j] = PedersenPublicKey_exec.commit(ec, global_ck, l_bin[j] ? a_vector[j] : new BN(0), t_vector[j])[0];
            c_d_vector[j] = PedersenPublicKey_exec.commit(ec, global_ck, new BN(0), rho_vector[j])[0];
            for (let i = 0; i < N; i++) {
                let tmp = c_vector[i].mul(p(i, j));
                c_d_vector[j].commitment = c_d_vector[j].commitment.add(tmp);
            }
            let D_m = new BN(0).tryToRed(red);
            for (let i = 0; i < N; i++) {
                let tmp = redy_pow_k[i].redMul(p(i, j).tryToRed(red));
                D_m = D_m.redAdd(tmp);
            }
            D_vector[j] = LiftedElgamalEnc.encrypt(ec, global_pk, D_m, R_vector[j]);
        }

        let m = PedersenPublicKey_exec.commit(ec, global_ck, s_prime, t_prime)[0];

        /*----- compute challenge x -----*/
        msg.push(encodePoint(c.commitment));
        for (let i = 0; i < n; i++) {
            msg.push(encodePoint(c_l_vector[i].commitment));
            msg.push(encodePoint(c_a_vector[i].commitment));
            msg.push(encodePoint(c_b_vector[i].commitment));
            msg.push(encodePoint(c_d_vector[i].commitment));
            msg.push(encodePoint(D_vector[i].c1));
            msg.push(encodePoint(D_vector[i].c2));
        }
        msg.push(encodePoint(m.commitment));

        let x = computeChallenge(msg, ec.curve.n);
        /*-------------------------------*/

        let redx = x.tryToRed(red);
        let redx_pow_k = [];
        redx_pow_k[0] = new BN(1).tryToRed(red);
        for (let k = 1; k <= n; k++) {
            redx_pow_k[k] = redx_pow_k[k - 1].redMul(redx);
        }

        let f_vector = [];
        let z_a_vector = [];
        let z_b_vector = [];
        for (let j = 0; j < n; j++) {
            f_vector[j] = l_bin[j] ? a_vector[j].add(x).umod(ec.curve.n) : a_vector[j];
            z_a_vector[j] = tau_vector[j].mul(x).add(s_vector[j]).umod(ec.curve.n);
            z_b_vector[j] = tau_vector[j].mul(x.sub(f_vector[j])).add(t_vector[j]).umod(ec.curve.n);
        }

        let z_d = redx_pow_k[n].redMul(t.tryToRed(red)).redNeg();
        for (let i = 0; i < n; i++) {
            let tmp = redx_pow_k[i].redMul(rho_vector[i].tryToRed(red));
            z_d = z_d.redSub(tmp);
        }

        let R = new BN(0).tryToRed(red);
        for (let i = 0; i < N; i++) {
            let tmp = redy_pow_k[i].redMul(r_list[i].tryToRed(red));
            R = R.redAdd(tmp);
        }
        R = R.redMul(redx_pow_k[n]);
        for (let i = 0; i < n; i++) {
            let tmp = redx_pow_k[i].redMul(R_vector[i].tryToRed(red));
            R = R.redAdd(tmp);
        }

        let v1 = redx.redMul(sk.tryToRed(red)).redAdd(s_prime.tryToRed(red));
        let v2 = redx.redMul(t.tryToRed(red)).redAdd(t_prime.tryToRed(red));

        return new NullificationProof(
            c,
            c_l_vector,
            c_a_vector,
            c_b_vector,
            c_d_vector,
            D_vector,
            m,
            f_vector,
            z_a_vector,
            z_b_vector,
            z_d,
            R,
            v1,
            v2
        );
    }

    /**
     * 
     * @param {EC} ec 
     * @param {Point} global_pk 
     * @param {PedersenPublicKey} global_ck 
     * @param {Point[]} pk_list 
     * @param {ElgamalCiphertext[]} E_list 
     * @param {NullificationProof} proof 
     * @returns {boolean}
     */
    verifyNullificationProof(
        ec,
        global_pk,
        global_ck,
        pk_list,
        E_list,
        proof
    ) {
        let {
            c,
            c_l_vector,
            c_a_vector,
            c_b_vector,
            c_d_vector,
            D_vector,
            m,
            f_vector,
            z_a_vector,
            z_b_vector,
            z_d,
            R,
            v1,
            v2
        } = proof;

        let N = pk_list.length;
        assert.ok(E_list.length === N, "'E_list.length' should be N.");
        let n = Math.ceil(Math.log2(N));

        /*----- compute challenge y -----*/
        let msg = [];
        msg.push(encodePoint(global_pk));
        for (let i = 0; i <= global_ck.n; i++) {
            msg.push(encodePoint(global_ck.generators[i]));
        }
        for (let i = 0; i < N; i++) {
            msg.push(encodePoint(pk_list[i]));
        }
        for (let i = 0; i < N; i++) {
            msg.push(encodePoint(E_list[i].c1));
            msg.push(encodePoint(E_list[i].c2));
        }
        let y = computeChallenge(msg, ec.curve.n);
        /*-------------------------------*/

        let red = BN.red(ec.curve.n);
        let redy = y.tryToRed(red);
        let redy_pow_k = [];
        redy_pow_k[0] = new BN(1).tryToRed(red);
        for (let k = 1; k <= N; k++) {
            redy_pow_k[k] = redy_pow_k[k - 1].redMul(redy);
        }

        /*----- compute challenge x -----*/
        msg.push(encodePoint(c.commitment));
        for (let i = 0; i < n; i++) {
            msg.push(encodePoint(c_l_vector[i].commitment));
            msg.push(encodePoint(c_a_vector[i].commitment));
            msg.push(encodePoint(c_b_vector[i].commitment));
            msg.push(encodePoint(c_d_vector[i].commitment));
            msg.push(encodePoint(D_vector[i].c1));
            msg.push(encodePoint(D_vector[i].c2));
        }
        msg.push(encodePoint(m.commitment));

        let x = computeChallenge(msg, ec.curve.n);
        /*-------------------------------*/

        let redx = x.tryToRed(red);
        let redx_pow_k = [];
        redx_pow_k[0] = new BN(1).tryToRed(red);
        for (let k = 1; k <= n; k++) {
            redx_pow_k[k] = redx_pow_k[k - 1].redMul(redx);
        }

        let cneg = c.commitment.neg();
        let c_vector = [];
        for (let i = 0; i < N; i++) {
            c_vector[i] = pk_list[i].add(cneg);
        }

        let f = (j, b) => {
            if (b === 1) {
                return f_vector[j].tryToRed(red);
            } else if (b === 0) {
                return redx.redSub(f_vector[j].tryToRed(red));
            } else {
                throw new Error("'b' should be 0 or 1.");
            }
        };

        let invalidList = [];// debug
        let valid = true;
        let cur;

        for (let j = 0; j < n; j++) {
            let leftSide1 = Commitment_exec.pow(c_l_vector[j], x);
            leftSide1 = Commitment_exec.mul(leftSide1, c_a_vector[j]);
            let rightSide1 = PedersenPublicKey_exec.commit(ec, global_ck, f_vector[j], z_a_vector[j])[0];

            cur = Commitment_exec.isEqual(leftSide1, rightSide1);
            valid &= cur;
            if (!cur) invalidList.push("1." + j);
        }

        for (let j = 0; j < n; j++) {
            let tmp = redx.redSub(f_vector[j].tryToRed(red));
            let leftSide2 = Commitment_exec.pow(c_l_vector[j], tmp);
            leftSide2 = Commitment_exec.mul(leftSide2, c_b_vector[j]);
            let rightSide2 = PedersenPublicKey_exec.commit(ec, global_ck, new BN(0), z_b_vector[j])[0];

            cur = Commitment_exec.isEqual(leftSide2, rightSide2);
            valid &= cur;
            if (!cur) invalidList.push("2." + j);
        }

        let leftSide3 = new Commitment(ec.infinitePoint());
        for (let i = 0; i < N; i++) {
            let tmp = new BN(1).tryToRed(red);
            let i_bin = toBinary(i, n);
            for (let j = 0; j < n; j++) {
                tmp = tmp.redMul(f(j, i_bin[j]));
            }
            let tmp2 = c_vector[i].mul(tmp);
            leftSide3 = Commitment_exec.mul(leftSide3, new Commitment(tmp2));
        }
        for (let k = 0; k < n; k++) {
            let tmp = Commitment_exec.pow(c_d_vector[k], redx_pow_k[k].redNeg());
            leftSide3 = Commitment_exec.mul(leftSide3, tmp);
        }
        let rightSide3 = PedersenPublicKey_exec.commit(ec, global_ck, new BN(0), z_d)[0];
        cur = Commitment_exec.isEqual(leftSide3, rightSide3);
        valid &= cur;
        if (!cur) invalidList.push("3");

        let leftSide4 = ElgamalCiphertext_exec.identity(ec);
        for (let i = 0; i < N; i++) {
            let tmp1 = ElgamalCiphertext_exec.mul(E_list[i], redx_pow_k[n]);

            let tmp2 = new BN(1).tryToRed(red);
            let i_bin = toBinary(i, n);
            for (let j = 0; j < n; j++) {
                tmp2 = tmp2.redMul(f(j, i_bin[j]));
            }
            tmp2 = tmp2.redNeg();

            let tmp3 = LiftedElgamalEnc.encrypt(ec, global_pk, tmp2, new BN(0));

            let tmp4 = ElgamalCiphertext_exec.add(tmp1, tmp3);
            tmp4 = ElgamalCiphertext_exec.mul(tmp4, redy_pow_k[i]);

            leftSide4 = ElgamalCiphertext_exec.add(leftSide4, tmp4);
        }
        for (let k = 0; k < n; k++) {
            let tmp = ElgamalCiphertext_exec.mul(D_vector[k], redx_pow_k[k]);
            leftSide4 = ElgamalCiphertext_exec.add(leftSide4, tmp);
        }
        let rightSide4 = LiftedElgamalEnc.encrypt(ec, global_pk, 0, R);
        cur = ElgamalCiphertext_exec.eq(leftSide4, rightSide4);
        valid &= cur;
        if (!cur) invalidList.push("4");

        let leftSide5 = PedersenPublicKey_exec.commit(ec, global_ck, v1, v2)[0];
        let rightSide5 = Commitment_exec.pow(c, x);
        rightSide5 = Commitment_exec.mul(rightSide5, m);
        cur = Commitment_exec.isEqual(leftSide5, rightSide5);
        valid &= cur;
        if (!cur) invalidList.push("5");

        return Boolean(valid);
    }

    /**
     * 
     * @param {EC} ec 
     * @param {number} N 
     * @param {number[]} l_bin 
     * @param {BN[]} a_vector 
     * @returns {BN[][]} N polynomials, but don't have the same degree.
     */
    getAllPolys(ec, N, l_bin, a_vector) {
        /**
         * 
         * @param {number} j 
         * @param {0 | 1} b 
         * @returns {BN[]}
         */
        let f = (j, b) => {
            if (b === 1) {
                if (l_bin[j]) {
                    return [a_vector[j], new BN(1)];
                } else {
                    return [a_vector[j]];
                }
            } else if (b === 0) {
                if (1 - l_bin[j]) {
                    return [a_vector[j].neg(), new BN(1)];
                } else {
                    return [a_vector[j].neg()];
                }
            } else {
                throw new Error("'b' should be 0 or 1.");
            }
        };

        let n = Math.ceil(Math.log2(N));
        let polysMap = new Map();

        /**
         * 
         * @param {string} binStr 
         */
        function getOnePoly(binStr) {
            let l = binStr.length;
            let cur = Number(binStr[l - 1]);
            let pre = binStr.slice(0, -1);

            if (pre === "") {
                polysMap.set(binStr, f(0, cur));
                return;
            }
            if (!polysMap.has(pre)) {
                getOnePoly(pre);
            }

            let res = polyMultiply(polysMap.get(pre), f(l - 1, cur), ec.curve.n);
            polysMap.set(binStr, res);
        };

        let res = [];
        for (let i = 0; i < N; i++) {
            let i_binStr = toBinaryString(i, n);
            getOnePoly(i_binStr);
            res[i] = polysMap.get(i_binStr);
        }
        return res;
    }

    /**
     * 
     * @param {EC} ec 
     * @param {number} n n = ceil(log2(N)) 
     * @returns {{ t:BN, s_prime:BN, t_prime:BN, tau_vector:BN[],a_vector:BN[],
     *  s_vector:BN[], t_vector:BN[], rho_vector:BN[], R_vector:BN[] }}
     */
    generateInitialMessage(ec, n) {
        let t = ec.randomBN();
        let s_prime = ec.randomBN();
        let t_prime = ec.randomBN();

        let tau_vector = [];
        let a_vector = [];
        let s_vector = [];
        let t_vector = [];
        let rho_vector = [];
        let R_vector = [];
        for (let i = 0; i < n; i++) {
            tau_vector[i] = ec.randomBN();
            a_vector[i] = ec.randomBN();
            s_vector[i] = ec.randomBN();
            t_vector[i] = ec.randomBN();
            rho_vector[i] = ec.randomBN();
            R_vector[i] = ec.randomBN();
        }

        return { t, s_prime, t_prime, tau_vector, a_vector, s_vector, t_vector, rho_vector, R_vector };
    }
}

class NullificationProof {
    constructor(
        c,
        c_l_vector,
        c_a_vector,
        c_b_vector,
        c_d_vector,
        D_vector,
        m,
        f_vector,
        z_a_vector,
        z_b_vector,
        z_d,
        R,
        v1,
        v2
    ) {
        this.c = c;
        this.c_l_vector = c_l_vector;
        this.c_a_vector = c_a_vector;
        this.c_b_vector = c_b_vector;
        this.c_d_vector = c_d_vector;
        this.D_vector = D_vector;
        this.m = m;
        this.f_vector = f_vector;
        this.z_a_vector = z_a_vector;
        this.z_b_vector = z_b_vector;
        this.z_d = z_d;
        this.R = R;
        this.v1 = v1;
        this.v2 = v2;
    }
}

module.exports = {
    NullificationArgument: new NullificationArgument(),
    NullificationProof
};