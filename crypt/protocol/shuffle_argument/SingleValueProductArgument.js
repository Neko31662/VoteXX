const BN = require('../../primitiv/bn/bn');
const { transpose, vector_pow_vector, vector_pow_matrix } = require('./BasicFunction');
const { ElgamalCiphertext, ElgamalCiphertext_exec, ElgamalEnc } = require('../../primitiv/encryption/ElGamal');
const { PedersenPublicKey, PedersenPublicKey_exec, Commitment, Commitment_exec } = require('../../primitiv/commitment/pedersen_commitment');
const computeChallenge = require('../../primitiv/hash/hash');
const assert = require('assert');
const { encodePoint } = require('../../util/Serializer');

class SingleValueProductArgument {
    /**
     * 
     * @param {EC} ec 
     * @param {Point} pk Elgamal public key
     * @param {PedersenPublicKey} ck Pedersen public key 
     * @param {Commitment} c_a A Pedersen commitment
     * @param {BN} b A BN
     * @param {BN[]} a_vector A BN vector (length = n)
     * @param {BN} r A BN
     * @returns {SingleValueProductProof}
     */
    generateSingleValueProductProof(
        ec,
        pk,
        ck,
        c_a,
        b,
        a_vector,
        r
    ) {
        let n = a_vector.length;

        let red = BN.red(ec.curve.n);
        let b_vector = [];
        b_vector[0] = a_vector[0].tryToRed(red);
        for (let i = 1; i < n; i++) {
            b_vector[i] = b_vector[i - 1].redMul(a_vector[i].tryToRed(red));
        }

        let { d_vector, delta_vector, r_d, s_1, s_x } = this.generateInitialMessage(ec, n);

        delta_vector = delta_vector.map(value => value.tryToRed(red));
        d_vector = d_vector.map(value => value.tryToRed(red));

        let c_d = PedersenPublicKey_exec.commit(ec, ck, d_vector, r_d)[0];

        let tmp_vector1 = [];//length = n - 1
        for (let i = 0; i < n - 1; i++) {
            let tmp = new BN(ec.curve.n.subn(1)).tryToRed(red);
            tmp = tmp.redMul(delta_vector[i]);
            tmp_vector1[i] = tmp.redMul(d_vector[i + 1]);
        }

        let c_delta = PedersenPublicKey_exec.commit(ec, ck, tmp_vector1, s_1)[0];

        let tmp_vector2 = [];//length = n - 1
        for (let i = 0; i < n - 1; i++) {
            let tmp = delta_vector[i + 1];
            tmp = tmp.redSub(delta_vector[i].redMul(a_vector[i + 1].tryToRed(red)));
            tmp = tmp.redSub(d_vector[i + 1].redMul(b_vector[i].tryToRed(red)));
            tmp_vector2[i] = tmp;
        }
        let c_DELTA = PedersenPublicKey_exec.commit(ec, ck, tmp_vector2, s_x)[0];

        /*----- compute challenge -----*/
        let msg = [];
        msg.push(encodePoint(pk));
        for (let i = 0; i <= ck.n; i++) {
            msg.push(encodePoint(ck.generators[i]));
        }
        msg.push(encodePoint(c_a.commitment));
        msg.push(b.toString(16));
        msg.push(encodePoint(c_d.commitment));
        msg.push(encodePoint(c_delta.commitment));
        msg.push(encodePoint(c_DELTA.commitment));
        let x = computeChallenge(msg, ec.curve.n);
        /*-----------------------------*/

        let redx = x.tryToRed(red);

        let a_tilde_vector = [];
        for (let i = 0; i < n; i++) {
            a_tilde_vector[i] = redx.redMul(a_vector[i].tryToRed(red)).redAdd(d_vector[i]);
        }

        let r_tilde = redx.redMul(r.tryToRed(red)).redAdd(r_d.tryToRed(red));

        let b_tilde_vector = [];
        for (let i = 0; i < n; i++) {
            b_tilde_vector[i] = redx.redMul(b_vector[i].tryToRed(red)).redAdd(delta_vector[i]);
        }

        let s_tilde = redx.redMul(s_x.tryToRed(red)).redAdd(s_1.tryToRed(red));

        let proof = new SingleValueProductProof(c_d, c_delta, c_DELTA, a_tilde_vector, r_tilde, b_tilde_vector, s_tilde);
        return proof;
    }

    /**
     * 
     * @param {EC} ec 
     * @param {Point} pk Elgamal public key
     * @param {PedersenPublicKey} ck Pedersen public key 
     * @param {Commitment} c_a A Pedersen commitment
     * @param {BN} b A BN 
     * @param {SingleValueProductProof} proof 
     * @returns {Boolean}
     */
    verifySingleValueProductProof(
        ec,
        pk,
        ck,
        c_a,
        b,
        proof
    ) {
        let { c_d, c_delta, c_DELTA, a_tilde_vector, r_tilde, b_tilde_vector, s_tilde } = proof;
        let n = a_tilde_vector.length;
        assert.ok(b_tilde_vector.length === n, "'b_tilde_vector.length' should be equal to n.");

        /*----- compute challenge -----*/
        let msg = [];
        msg.push(encodePoint(pk));
        for (let i = 0; i <= ck.n; i++) {
            msg.push(encodePoint(ck.generators[i]));
        }
        msg.push(encodePoint(c_a.commitment));
        msg.push(b.toString(16));
        msg.push(encodePoint(c_d.commitment));
        msg.push(encodePoint(c_delta.commitment));
        msg.push(encodePoint(c_DELTA.commitment));
        let x = computeChallenge(msg, ec.curve.n);
        /*-----------------------------*/

        let red = BN.red(ec.curve.n);
        let redx = x.tryToRed(red);

        let invalidList = [];// debug
        let valid = true;
        let cur;

        let commitment_left1 = Commitment_exec.pow(c_a, x);
        commitment_left1 = Commitment_exec.mul(commitment_left1, c_d);
        let commitment_right1 = PedersenPublicKey_exec.commit(ec, ck, a_tilde_vector, r_tilde)[0];
        cur = Commitment_exec.isEqual(commitment_left1, commitment_right1);
        valid &= cur;
        if (!cur) invalidList.push(1);

        let commitment_left2 = Commitment_exec.pow(c_DELTA, x);
        commitment_left2 = Commitment_exec.mul(commitment_left2, c_delta);
        let tmp_vector = [];
        for (let i = 0; i < n - 1; i++) {
            let tmp1 = redx.redMul(b_tilde_vector[i + 1].tryToRed(red)); 4;
            let tmp2 = b_tilde_vector[i].tryToRed(red).redMul(a_tilde_vector[i + 1].tryToRed(red));
            tmp_vector[i] = tmp1.redSub(tmp2);
        }
        let commitment_right2 = PedersenPublicKey_exec.commit(ec, ck, tmp_vector, s_tilde)[0];
        cur = Commitment_exec.isEqual(commitment_left2, commitment_right2);
        valid &= cur;
        if (!cur) invalidList.push(2);

        cur = b_tilde_vector[0].eq(a_tilde_vector[0]);
        valid &= cur;
        if (!cur) invalidList.push(3);

        let xb = redx.redMul(b.tryToRed(red)).fromRed();
        cur = b_tilde_vector[n - 1].eq(xb);
        valid &= cur;
        if (!cur) invalidList.push(4);

        if (valid) return true;
        else return false;
    }

    /**
     * 
     * @param {EC} ec 
     * @param {number} n 
     * @returns {{d_vector:BN[], delta_vector:BN[], r_d:BN, s_1:BN, s_x:BN }}
     */
    generateInitialMessage(ec, n) {
        let d_vector = [];
        let delta_vector = [];
        let r_d = ec.randomBN();
        let s_1 = ec.randomBN();
        let s_x = ec.randomBN();
        for (let i = 0; i < n; i++) {
            d_vector[i] = ec.randomBN();
        }
        delta_vector[0] = d_vector[0];
        for (let i = 1; i < n - 1; i++) {
            delta_vector[i] = ec.randomBN();
        }
        delta_vector[n - 1] = new BN(0);

        return { d_vector, delta_vector, r_d, s_1, s_x };
    }
}

class SingleValueProductProof {
    constructor(
        c_d,
        c_delta,
        c_DELTA,
        a_tilde_vector,
        r_tilde,
        b_tilde_vector,
        s_tilde,
    ) {
        this.c_d = c_d;
        this.c_delta = c_delta;
        this.c_DELTA = c_DELTA;
        this.a_tilde_vector = a_tilde_vector;
        this.r_tilde = r_tilde;
        this.b_tilde_vector = b_tilde_vector;
        this.s_tilde = s_tilde;
    }
}

module.exports = {
    SingleValueProductArgument: new SingleValueProductArgument(),
    SingleValueProductProof
};